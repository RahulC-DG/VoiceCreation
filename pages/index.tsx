import { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CodeGenEvent {
  type: string;
  sessionId: string;
  timestamp: string;
  [key: string]: any;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>('Disconnected');
  const [currentPhase, setCurrentPhase] = useState<'ideation' | 'prompt_review' | 'code_generation' | 'voice_editing'>('ideation');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [codeGenStatus, setCodeGenStatus] = useState<string>('');
  const [codeGenLogs, setCodeGenLogs] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);

  const connect = async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket('ws://localhost:3000'); // agent port
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      setStatus('Connected');
      startMic(ws);
    };
    ws.onmessage = (evt) => {
      if (typeof evt.data === 'string') {
        try {
          const msg = JSON.parse(evt.data);
          
          // Handle chat messages
          if (msg.type === 'text') {
            setMessages((prev) => [...prev, { role: msg.role, content: msg.content }]);
          }
          
          // Handle phase transitions
          else if (msg.type === 'phase_transition') {
            setCurrentPhase(msg.phase);
            if (msg.phase === 'code_generation') {
              setShowPreview(true);
              setCodeGenStatus('Starting code generation...');
            }
          }
          
          // Handle code generation events
          else if (msg.type?.startsWith('codegen-')) {
            handleCodeGenEvent(msg as CodeGenEvent);
          }
        } catch (_) {}
      } else {
        playAudio(evt.data);
      }
    };
    ws.onclose = () => {
      setStatus('Disconnected');
      cleanup();
    };
    ws.onerror = () => setStatus('Error');
    wsRef.current = ws;
  };

  const handleCodeGenEvent = (event: CodeGenEvent) => {
    switch (event.type) {
      case 'codegen-start':
        setCodeGenStatus('🚀 Code generation started...');
        setCodeGenLogs([]);
        break;
        
      case 'codegen-validation-passed':
        setCodeGenStatus('✅ YAML validation passed');
        break;
        
      case 'codegen-log':
        if (event.chunk) {
          setCodeGenLogs(prev => [...prev, event.chunk]);
        }
        break;
        
      case 'codegen-preview-ready':
        setPreviewUrl(event.url);
        setCodeGenStatus(`🎉 Preview ready! Loading...`);
        break;
        
      case 'codegen-complete':
        setCodeGenStatus(`✅ Code generation complete! (${Math.round(event.duration / 1000)}s)`);
        break;
        
      case 'codegen-error':
        setCodeGenStatus(`❌ Error: ${event.error}`);
        break;
        
      case 'codegen-cancelled':
        setCodeGenStatus('⏹️ Code generation cancelled');
        break;
    }
  };

  const startMic = async (ws: WebSocket) => {
    if (recording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    streamRef.current = stream;
    
    // Create recording AudioContext with 16kHz to match backend
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
      sampleRate: 16000 
    });
    audioCtxRef.current = audioCtx;
    
    // Create separate playback AudioContext with default sample rate for better TTS quality
    const playbackCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    playbackCtxRef.current = playbackCtx;
    
    // Resume contexts if suspended (required by modern browsers)
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    if (playbackCtx.state === 'suspended') {
      await playbackCtx.resume();
    }
    
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    source.connect(processor);
    processor.connect(audioCtx.destination);
    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        let s = Math.max(-1, Math.min(1, input[i]));
        int16[i] = s * 0x7fff;
      }
      ws.send(int16.buffer);
    };
    setRecording(true);
  };

  const stopMic = () => {
    if (!recording) return;
    processorRef.current?.disconnect();
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setRecording(false);
  };

  const playAudio = async (arrayBuf: ArrayBuffer) => {
    const playbackCtx = playbackCtxRef.current;
    if (!playbackCtx) {
      console.error('No playback AudioContext available');
      return;
    }
    
    // Ensure AudioContext is running
    if (playbackCtx.state === 'suspended') {
      await playbackCtx.resume();
    }
    
    try {
      const int16 = new Int16Array(arrayBuf);
      const float32 = new Float32Array(int16.length);
      
      // Convert Int16 to Float32 with proper scaling
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }
      
      // Audio is 16kHz from backend - create buffer at correct sample rate
      const sourceRate = 16000;
      const buffer = playbackCtx.createBuffer(1, float32.length, sourceRate);
      buffer.getChannelData(0).set(float32);
      
      const src = playbackCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(playbackCtx.destination);
      src.start();
      
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const cleanup = () => {
    stopMic();
    playbackCtxRef.current?.close();
    playbackCtxRef.current = null;
    wsRef.current = null;
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const getPhaseDisplay = () => {
    switch (currentPhase) {
      case 'ideation': return '💡 Ideation';
      case 'prompt_review': return '📝 Prompt Review';
      case 'code_generation': return '⚡ Code Generation';
      case 'voice_editing': return '🎙️ Voice Editing';
      default: return '🤖 Voice Assistant';
    }
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'ideation': return '#3b82f6';
      case 'prompt_review': return '#f59e0b';
      case 'code_generation': return '#10b981';
      case 'voice_editing': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#f8fafc'
    }}>
      {/* Chat Sidebar */}
      <div style={{ 
        width: showPreview ? '400px' : '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: showPreview ? '1px solid #e2e8f0' : 'none',
        background: '#ffffff',
        boxShadow: showPreview ? '2px 0 10px rgba(0,0,0,0.1)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff'
        }}>
          <h1 style={{ 
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            VoiceCreation
          </h1>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px'
          }}>
            <div style={{ 
              padding: '4px 12px',
              borderRadius: '20px',
              background: getPhaseColor(),
              color: '#ffffff',
              fontWeight: '500'
            }}>
              {getPhaseDisplay()}
            </div>
            <div style={{ 
              color: status === 'Connected' ? '#10b981' : '#ef4444',
              fontWeight: '500'
            }}>
              {status}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ 
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{ 
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '18px',
                background: m.role === 'user' ? '#3b82f6' : '#f1f5f9',
                color: m.role === 'user' ? '#ffffff' : '#334155',
                fontSize: '14px',
                lineHeight: '1.5',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        {/* Code Generation Status */}
        {showPreview && (
          <div style={{ 
            padding: '16px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}>
            <div style={{ 
              fontSize: '14px',
              fontWeight: '500',
              color: '#475569',
              marginBottom: '8px'
            }}>
              {codeGenStatus}
            </div>
            {codeGenLogs.length > 0 && (
              <div style={{ 
                maxHeight: '100px',
                overflowY: 'auto',
                fontSize: '12px',
                color: '#64748b',
                fontFamily: 'monospace',
                background: '#ffffff',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                {codeGenLogs.slice(-10).map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div style={{ 
          padding: '20px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {!recording ? (
              <button 
                onClick={connect}
                style={{
                  padding: '12px 24px',
                  borderRadius: '25px',
                  border: 'none',
                  background: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
              >
                🎙️ Start Talking
              </button>
            ) : (
              <button 
                onClick={stopMic}
                style={{
                  padding: '12px 24px',
                  borderRadius: '25px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
              >
                ⏹️ Stop
              </button>
            )}
            
            {recording && (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <div style={{ 
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'pulse 1s infinite'
                }} />
                Recording...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff'
        }}>
          {/* Preview Header */}
          <div style={{ 
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff'
          }}>
            <div>
              <h2 style={{ 
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                Live Preview
              </h2>
              {previewUrl && (
                <div style={{ 
                  fontSize: '12px',
                  color: '#64748b',
                  marginTop: '4px',
                  fontFamily: 'monospace'
                }}>
                  {previewUrl}
                </div>
              )}
            </div>
            
            {previewUrl && (
              <button
                onClick={openInNewTab}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                🔗 Open in New Tab
              </button>
            )}
          </div>

          {/* Preview Content */}
          <div style={{ 
            flex: 1,
            position: 'relative',
            background: '#f8fafc'
          }}>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '0'
                }}
                title="Live Preview"
              />
            ) : (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: '16px',
                color: '#64748b'
              }}>
                <div style={{ 
                  fontSize: '48px',
                  opacity: 0.5
                }}>
                  ⚡
                </div>
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  Waiting for code generation...
                </div>
                <div style={{ 
                  fontSize: '14px',
                  textAlign: 'center',
                  maxWidth: '300px',
                  lineHeight: '1.5'
                }}>
                  Your generated application will appear here once the code generation is complete.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
} 
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [codeGenStatus, setCodeGenStatus] = useState<string>('');
  const [codeGenLogs, setCodeGenLogs] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [projectSessionId, setProjectSessionId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<ArrayBuffer[]>([]);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chunkCounterRef = useRef<number>(0);
  const frontendSequenceRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const [recording, setRecording] = useState(false);
  
  // Ref for auto-scrolling messages container
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const codeGenLogsRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll code generation logs
  const scrollCodeGenLogsToBottom = () => {
    if (codeGenLogsRef.current) {
      codeGenLogsRef.current.scrollTop = codeGenLogsRef.current.scrollHeight;
    }
  };

  // Effect to scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to scroll when code generation logs change
  useEffect(() => {
    scrollCodeGenLogsToBottom();
  }, [codeGenLogs]);

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
        // Handle binary audio data
        frontendSequenceRef.current++;
        const frontendSeq = frontendSequenceRef.current;
        
        console.log(`🎧 [Frontend-${frontendSeq}] Received audio data: ${evt.data.byteLength} bytes`);
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
        if (event.sessionId) {
          setProjectSessionId(event.sessionId);
        }
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
        sampleRate: 24000,  // Match backend - 24kHz
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    streamRef.current = stream;
    
    // Create single AudioContext with 24kHz for both recording and playback
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
      sampleRate: 24000  // Match backend exactly
    });
    audioCtxRef.current = audioCtx;
    playbackCtxRef.current = audioCtx;  // Use same context for playback
    
    // Resume context if suspended (required by modern browsers)
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
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
    playbackCtxRef.current = null;  // Clear the shared reference
    setRecording(false);
  };

  const playAudio = async (arrayBuf: ArrayBuffer) => {
    chunkCounterRef.current++;
    const chunkId = chunkCounterRef.current;
    
    console.log(`🎵 [Chunk-${chunkId}] Processing audio (${arrayBuf.byteLength} bytes), current buffer: ${audioBufferRef.current.length} chunks, isPlaying: ${isPlayingRef.current}`);
    
    // Add chunk to buffer
    audioBufferRef.current.push(arrayBuf);
    
    // If already playing, just add to buffer and return
    if (isPlayingRef.current) {
      console.log(`⏸️ [Chunk-${chunkId}] Audio already playing, adding to buffer (${audioBufferRef.current.length} chunks)`);
      return;
    }
    
    // Clear existing timeout
    if (bufferTimeoutRef.current) {
      console.log(`⏰ [Chunk-${chunkId}] Clearing previous timeout`);
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }
    
    // Play immediately if we have 3+ chunks, otherwise set a very short timeout
    const bufferSize = audioBufferRef.current.length;
    if (bufferSize >= 3) {
      console.log(`🚀 [Chunk-${chunkId}] Playing immediately (${bufferSize} chunks)`);
      playBufferedAudio(chunkId);
    } else {
      // Very short timeout only for the first 1-2 chunks
      bufferTimeoutRef.current = setTimeout(() => {
        if (!isPlayingRef.current) { // Double-check we're not playing
          console.log(`🎬 [Chunk-${chunkId}] Quick timeout (5ms), playing ${audioBufferRef.current.length} chunks`);
          playBufferedAudio(chunkId);
        }
      }, 5); // Minimal 5ms delay
    }
  };

  const playBufferedAudio = async (triggerChunkId: number) => {
    const playbackCtx = playbackCtxRef.current;
    if (!playbackCtx || audioBufferRef.current.length === 0 || isPlayingRef.current) {
      console.log(`⚠️ [Trigger-${triggerChunkId}] Cannot play: ctx=${!!playbackCtx}, buffer=${audioBufferRef.current.length}, isPlaying=${isPlayingRef.current}`);
      return;
    }
    
    // Mark as playing
    isPlayingRef.current = true;
    
    const chunksToPlay = audioBufferRef.current.length;
    const playbackId = `${triggerChunkId}-${chunksToPlay}chunks`;
    console.log(`🔄 [Playback-${playbackId}] Starting playback of ${chunksToPlay} buffered chunks`);
    
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      console.log(`⏹️ [Playback-${playbackId}] Stopping previous audio for new buffered segment`);
      try {
        currentAudioRef.current.stop();
      } catch (e) {
        // Ignore errors from stopping already stopped sources
      }
      currentAudioRef.current = null;
    }
    
    try {
      // Combine all buffered chunks
      const totalBytes = audioBufferRef.current.reduce((sum, buf) => sum + buf.byteLength, 0);
      console.log(`📊 [Playback-${playbackId}] Combining ${chunksToPlay} chunks into ${totalBytes} total bytes`);
      
      const combinedBuffer = new ArrayBuffer(totalBytes);
      const combinedView = new Uint8Array(combinedBuffer);
      
      let offset = 0;
      for (let i = 0; i < audioBufferRef.current.length; i++) {
        const chunk = audioBufferRef.current[i];
        const chunkSize = chunk.byteLength;
        combinedView.set(new Uint8Array(chunk), offset);
        console.log(`📦 [Playback-${playbackId}] Chunk ${i+1}/${chunksToPlay}: ${chunkSize} bytes at offset ${offset}`);
        offset += chunkSize;
      }
      
      // Clear buffer
      const processedChunks = audioBufferRef.current.length;
      audioBufferRef.current = [];
      console.log(`🧹 [Playback-${playbackId}] Buffer cleared (processed ${processedChunks} chunks), ready for next batch`);
      
      // Convert combined buffer to audio
      const int16 = new Int16Array(combinedBuffer);
      const float32 = new Float32Array(int16.length);
      
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }
      
      const buffer = playbackCtx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      
      const source = playbackCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(playbackCtx.destination);
      
      // Track current audio source
      currentAudioRef.current = source;
      
      // Clear reference when audio ends and check for more chunks
      source.onended = () => {
        console.log(`✅ [Playback-${playbackId}] Audio segment completed (${buffer.duration.toFixed(3)}s duration)`);
        currentAudioRef.current = null;
        isPlayingRef.current = false;
        
        // Check if there are more chunks to play
        if (audioBufferRef.current.length > 0) {
          console.log(`🔄 [Playback-${playbackId}] More chunks available (${audioBufferRef.current.length}), starting next playback`);
          // Small delay to prevent rapid-fire playback
          setTimeout(() => {
            if (!isPlayingRef.current && audioBufferRef.current.length > 0) {
              playBufferedAudio(triggerChunkId + 1000); // Use different ID for queued playback
            }
          }, 10);
        }
      };
      
      console.log(`▶️ [Playback-${playbackId}] Starting audio: ${buffer.duration.toFixed(3)}s duration from ${processedChunks} chunks`);
      source.start();
      
    } catch (error) {
      console.error(`❌ [Playback-${playbackId}] Audio buffering error:`, error);
      currentAudioRef.current = null;
      isPlayingRef.current = false;
      // Clear buffer on error to prevent stuck state
      audioBufferRef.current = [];
    }
  };

  const cleanup = () => {
    stopMic();
    
    // Clear buffer timeout
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }
    
    // Clear audio buffer
    audioBufferRef.current = [];
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
      currentAudioRef.current = null;
    }
    
    playbackCtxRef.current?.close();
    playbackCtxRef.current = null;
    wsRef.current = null;
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const downloadCode = async () => {
    if (!projectSessionId) {
      alert('No project available to download');
      return;
    }

    setIsDownloading(true);
    try {
      // Request the backend to create a ZIP file of the generated code
      const response = await fetch(`http://localhost:3000/download/${projectSessionId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found or has been cleaned up');
        } else if (response.status === 500) {
          throw new Error('Server error - please ensure archiver dependency is installed');
        } else {
          throw new Error(`Download failed: ${response.statusText}`);
        }
      }

      // Get the ZIP file as a blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voice-creation-${projectSessionId}.zip`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download code. Please try again.';
      alert(`Download Error: ${errorMessage}\n\nIf this is the first time using the download feature, please run:\nnpm install archiver @types/archiver`);
    } finally {
      setIsDownloading(false);
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
        <div 
          ref={messagesContainerRef}
          style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            scrollBehavior: 'smooth'
          }}
        >
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
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
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
              <div 
                ref={codeGenLogsRef}
                style={{ 
                  maxHeight: '100px',
                  overflowY: 'auto',
                  fontSize: '12px',
                  color: '#64748b',
                  fontFamily: 'monospace',
                  background: '#ffffff',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  scrollBehavior: 'smooth'
                }}
              >
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={downloadCode}
                  disabled={isDownloading || !projectSessionId}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #10b981',
                    background: isDownloading ? '#f3f4f6' : '#10b981',
                    color: isDownloading ? '#9ca3af' : '#ffffff',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: isDownloading || !projectSessionId ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!isDownloading && projectSessionId) {
                      e.currentTarget.style.background = '#059669';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isDownloading && projectSessionId) {
                      e.currentTarget.style.background = '#10b981';
                    }
                  }}
                >
                  {isDownloading ? '⏳ Downloading...' : '📥 Download Code'}
                </button>
                
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
              </div>
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
import { createClient, AgentEvents } from '@deepgram/sdk';
import { WebSocket, WebSocketServer } from 'ws';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { startCodeGeneration } from './codeGen';
import archiver from 'archiver';

// Load environment variables
dotenv.config();

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.error('Please set your DEEPGRAM_API_KEY in the .env file');
  process.exit(1);
}

// Track conversation state
interface ConversationState {
  phase: 'ideation' | 'prompt_review' | 'transitioning' | 'code_generation';
  lastYamlPrompt?: string;
  sessionId?: string;
  yamlBuffer?: string; // Buffer to accumulate YAML across multiple messages
}

let conversationState: ConversationState = { phase: 'ideation' };

// Audio chunk tracking
let audioChunkSequence = 0;
let lastAudioTimestamp = 0;

// Function to extract YAML from conversation text
function extractYamlFromText(text: string): string | null {
  // Try multiple patterns to extract YAML
  const patterns = [
    /```yaml\n([\s\S]*?)\n```/,  // Standard format
    /```yaml([\s\S]*?)```/,      // Without newlines
    /```\n([\s\S]*?)\n```/,      // Generic code block
    /yaml\n([\s\S]*?)$/m,        // YAML without closing ```
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const yamlContent = match[1].trim();
      
      // Strict validation - must contain ALL required fields for a complete YAML
      const hasProjectName = yamlContent.includes('project_name:');
      const hasDescription = yamlContent.includes('project_description:');
      const hasUsers = yamlContent.includes('users:');
      const hasGoal = yamlContent.includes('goal:');
      const hasFeatures = yamlContent.includes('features:');
      const hasTechStack = yamlContent.includes('tech_stack:');
      const hasUIStyle = yamlContent.includes('ui_style:');
      
      // Require ALL fields for valid YAML
      if (hasProjectName && hasDescription && hasUsers && hasGoal && hasFeatures && hasTechStack && hasUIStyle) {
        console.log('✅ COMPLETE YAML extracted with all required fields');
        console.log('  - Has project_name:', hasProjectName);
        console.log('  - Has description:', hasDescription);
        console.log('  - Has users:', hasUsers);
        console.log('  - Has goal:', hasGoal);
        console.log('  - Has features:', hasFeatures);
        console.log('  - Has tech_stack:', hasTechStack);
        console.log('  - Has ui_style:', hasUIStyle);
        return yamlContent;
      } else {
        console.log('⚠️ YAML found but missing required fields:');
        console.log('  - Has project_name:', hasProjectName);
        console.log('  - Has description:', hasDescription);
        console.log('  - Has users:', hasUsers);
        console.log('  - Has goal:', hasGoal);
        console.log('  - Has features:', hasFeatures);
        console.log('  - Has tech_stack:', hasTechStack);
        console.log('  - Has ui_style:', hasUIStyle);
        console.log('  Content preview:', yamlContent.substring(0, 200) + '...');
      }
    }
  }
  
  // Try to find YAML-like content even without code blocks - but still require complete structure
  if (text.includes('project_name:') && text.includes('features:') && text.includes('tech_stack:') && text.includes('users:') && text.includes('goal:')) {
    const lines = text.split('\n');
    let yamlStart = -1;
    let yamlEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('project_name:') && yamlStart === -1) {
        yamlStart = i;
      }
      if (yamlStart !== -1 && (lines[i].includes('ui_style:') || lines[i].includes('tech_stack:'))) {
        // Look for the end after ui_style or tech_stack
        for (let j = i; j < lines.length; j++) {
          if (lines[j].trim() === '' || lines[j].includes('How does that') || lines[j].includes('```')) {
            yamlEnd = j;
            break;
          }
        }
        if (yamlEnd === -1) yamlEnd = lines.length;
        break;
      }
    }
    
    if (yamlStart !== -1 && yamlEnd !== -1) {
      const yamlContent = lines.slice(yamlStart, yamlEnd).join('\n').trim();
      console.log('✅ COMPLETE YAML extracted without code blocks');
      return yamlContent;
    }
  }
  
  console.log('❌ No valid complete YAML found in text');
  return null;
}

// Function to detect if user approved the YAML prompt
function detectYamlApproval(userMessage: string): boolean {
  const approvalPhrases = [
    'looks good',
    'that looks good',
    'yes',
    'perfect',
    'great',
    'awesome',
    'i like that',
    'that works',
    'let\'s build',
    'let\'s go',
    'ready',
    'is ready',
    'it\'s ready',
    'the prompt is ready',
    'prompt is ready',
    'approved',
    'correct',
    'that\'s right',
    'sounds good',
    'good to go',
    'let\'s do it',
    'let\'s start',
    'move on',
    'next step',
    'continue',
    'proceed'
  ];
  
  const lowerMessage = userMessage.toLowerCase().trim();
  console.log('🔍 Checking approval for message:', lowerMessage);
  
  for (const phrase of approvalPhrases) {
    if (lowerMessage.includes(phrase)) {
      console.log(`🎯 APPROVAL DETECTED: "${userMessage}" matches phrase "${phrase}"`);
      return true;
    }
  }
  
  console.log('❌ No approval detected in message:', userMessage);
  return false;
}

// Function to generate a session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create HTTP server to serve the static HTML file
const server = http.createServer((req, res) => {
  // Add CORS headers for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/') {
    fs.readFile(path.join(__dirname, '../static/index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url?.startsWith('/download/') && req.method === 'GET') {
    // Handle download requests
    const sessionId = req.url.split('/download/')[1];
    handleDownloadRequest(sessionId, res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Function to handle download requests
async function handleDownloadRequest(sessionId: string, res: http.ServerResponse) {
  try {
    console.log(`📥 Download requested for session: ${sessionId}`);
    
    // Path to the generated project
    const projectPath = path.join(process.cwd(), 'generated', sessionId, 'repo');
    
    // Check if the project exists
    if (!fs.existsSync(projectPath)) {
      console.log(`❌ Project not found: ${projectPath}`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Project not found' }));
      return;
    }

    // Set response headers for ZIP download
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="voice-creation-${sessionId}.zip"`,
      'Cache-Control': 'no-cache'
    });

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err: Error) => {
      console.error('❌ Archive error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to create archive' }));
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add all files from the project directory
    console.log(`📦 Creating ZIP archive from: ${projectPath}`);
    archive.directory(projectPath, false);

    // Finalize the archive
    await archive.finalize();
    
    console.log(`✅ ZIP download completed for session: ${sessionId}`);
    
  } catch (error) {
    console.error('❌ Download error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
}

// Function to connect to Deepgram Voice Agent V1
async function connectToAgent() {
  try {
    // Connect directly to V1 WebSocket endpoint
    const agentWs = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`
      }
    });

    // Wait for connection to open
    await new Promise((resolve, reject) => {
      agentWs.on('open', () => {
      console.log('Agent connection established');
        resolve(void 0);
      });
      agentWs.on('error', reject);
    });

    // Send initial settings configuration
    const settings = {
      type: 'Settings',
        audio: {
          input: {
            encoding: 'linear16',
          sample_rate: 24000  // Match Deepgram starter - 24kHz
          },
          output: {
            encoding: 'linear16',
          sample_rate: 24000,  // Match Deepgram starter - 24kHz
            container: 'none'
          }
        },
        agent: {
          listen: {
            provider: {
              type: 'deepgram',
            model: 'nova-3'  // More stable model
            }
          },
          think: {
            provider: {
              type: 'open_ai',
              model: 'gpt-4o-mini'
            },
          /*
             * SYSTEM PROMPT  –  IDEATION & PROMPT-REVIEW AGENT
             * ------------------------------------------------
             * This agent's job is ONLY Phase 1 (Ideation) and Phase 2 (Prompt Review).
             * 1. Have a natural conversation to discover:
             *    • App idea & purpose
             *    • Target users / use-cases
             *    • Core features & pain-points
             *    • Preferred tech stack & design style
             * 2. After enough info, propose a YAML "system prompt" that follows this template:
             *    project_name: <string>
             *    project_description: |
             *      <multi-line>
             *    users: [ ... ]
             *    features: [ ... ]
             *    tech_stack:
             *      frontend: <string>
             *      backend: <string | optional>
             *      database: <string | optional>
             *    ui_style: <string>
             * 3. Read the YAML back to the user and explicitly ask:  
             *       "Would you like to edit this prompt or is it ready?"
             * 4. If the user wants edits, continue iterating.  NEVER advance to code generation.
             * 5. Stop when the user clearly says the prompt is approved (e.g. "Looks good", "Yes, let's build").
             * Other rules:
             * • Responses should be friendly and concise (≤ 2 sentences) but can break the limit when reading the YAML.
             * • ALWAYS keep the user involved – use wording like "We" and "Let's".
             */
          prompt: `You are an innovative problem-solving partner who helps people discover breakthrough solutions. You're not just validating ideas - you're pushing for innovation and challenging conventional thinking.

Your conversation style:
• Be a thoughtful challenger - supportive but provocative
• Ask ONE probing question at a time that forces deeper thinking
• Challenge assumptions aggressively: "Wait, why does this problem even exist? What if we approached it completely differently?"
• Push for innovation: "That's been tried before - what would make this 10x better than existing solutions?"
• Question the status quo: "Everyone does it that way, but what if we flipped that assumption entirely?"
• Demand specificity: "That sounds vague - can you give me a concrete example of when this problem ruins someone's day?"
• Be a devil's advocate: "I'm skeptical - convince me this is worth building when there are already solutions out there."

Your mission is to help them discover innovative solutions by:
• Digging deep into the ROOT PROBLEM, not just surface symptoms
• Challenging them to think beyond obvious solutions
• Pushing for unique angles and differentiation
• Making them defend their approach with concrete examples
• Forcing them to consider what would make their solution truly revolutionary

Key challenging questions to weave in naturally (NEVER repeat the same question):
• "What's the real problem here? Not the symptom, but the underlying issue?"
• "Why hasn't someone solved this already? What's different about your approach?"
• "What would have to be true for this to be 10x better than what exists?"
• "Who else is trying to solve this? How would you crush the competition?"
• "What's the most innovative part of your solution? What would make people say 'wow, I never thought of that'?"
• "If you had unlimited resources, how would you solve this differently?"
• "What assumption is everyone making that you're going to prove wrong?"

CRITICAL RESPONSIVENESS RULES:
• After 3-4 exchanges, if the user seems to have a clear direction, ask: "Do you feel ready to start building this, or should we explore more?"
• NEVER repeat questions you've already asked
• If the user says they're ready, excited, or seems eager to build, IMMEDIATELY move to YAML creation
• Watch for signals like "let's build this", "I'm ready", "this sounds good", "let's do it"
• Don't force 7-8 exchanges if the user is ready sooner
• Be responsive to user energy and enthusiasm

When you have enough info (as few as 3-4 exchanges if user is ready), provide ONLY a human-friendly summary like: "Perfect! So we're building [PROJECT NAME] - a [brief description] that helps [target users] by [main problem solved]. The key features will be [list 2-3 main features]. It'll have a [ui_style] design and be built with [tech stack]. Sound good?"

Then IMMEDIATELY follow with the technical YAML. CRITICAL: The YAML will be automatically filtered out from your speech and display - you should include it but it will be completely hidden from the user:

\`\`\`yaml
project_name: [Name based on their idea]
project_description: |
  [Description capturing their vision - can be multiple lines]
users:
  - [Primary user type they mentioned]
  - [Secondary user type if applicable]
goal:
  - [Main problem being solved]
  - [Success metric they mentioned]
features:
  - [Core feature they described]
  - [Another feature they mentioned]
  - [Additional logical features]
  - Landing page
  - Dashboard
  - Settings page
  - Profile page
  - Login/signup flow
tech_stack:
  frontend: Next.js
  backend: Node.js
ui_style: [Style description based on their vision]
\`\`\`

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. The system will automatically block any YAML content from being displayed or spoken
2. Include the complete YAML after your human summary - it will be filtered out automatically
3. The human summary should be conversational and engaging when spoken
4. The YAML must be complete with ALL 7 required fields: project_name, project_description, users, goal, features, tech_stack, ui_style
5. Do NOT split across multiple messages - everything in ONE response
6. The YAML must end with the closing \`\`\` 

IMPORTANT: The YAML will be completely hidden from the user but processed by the system.

If they approve, respond briefly like "Perfect! Let's build it!" and stop.`,
          },
          speak: {
            provider: {
              type: 'deepgram',
            model: 'aura-2-arcas-en'
            }
          },
          greeting: "Hey there! What problem are you trying to solve? I'm here to help you think through it and push you toward something truly innovative."
        }
    };

    agentWs.send(JSON.stringify(settings));

    // Set up message handler
    agentWs.on('message', async (data: Buffer) => {
      try {
        // Improved detection of JSON vs binary data - match Deepgram starter approach
        let isJson = false;
        let message: any = null;
        
        try {
          // Try to parse as JSON first
          const dataStr = data.toString('utf8');
          message = JSON.parse(dataStr);
          isJson = true;
        } catch {
          // Not JSON, treat as binary audio data
          isJson = false;
        }

        if (isJson && message) {
          // Handle JSON messages
          console.log('Received message:', message.type);

          if (message.type === 'Welcome') {
            console.log('Server welcome message:', message);
          } else if (message.type === 'SettingsApplied') {
            console.log('Server confirmed settings:', message);
          } else if (message.type === 'ConversationText') {
            // Log and forward the conversation text to browser
            console.log(`${message.role}: ${message.content}`);
            
            // AGGRESSIVE YAML BLOCKING - completely prevent YAML from being displayed or spoken
            if (message.role === 'assistant') {
              // Check if this message contains any YAML content
              const hasYamlContent = message.content.includes('```yaml') || 
                                   message.content.includes('project_name:') ||
                                   message.content.includes('tech_stack:') ||
                                   message.content.includes('features:') ||
                                   message.content.includes('users:') ||
                                   message.content.includes('ui_style:') ||
                                   message.content.includes('goal:') ||
                                   message.content.includes('project_description:') ||
                                   message.content.match(/^\s*-\s+/m) || // YAML list items
                                   message.content.match(/^\s*\w+:\s*.*$/m); // YAML key-value pairs
              
              if (hasYamlContent) {
                console.log('🚫 BLOCKING YAML MESSAGE COMPLETELY - not displaying or speaking');
                console.log('Blocked content preview:', message.content.substring(0, 100) + '...');
                // Don't send anything to browser - completely block YAML messages
              } else {
                // Only send non-YAML messages
                if (browserWs?.readyState === WebSocket.OPEN) {
                  browserWs.send(JSON.stringify({ type: 'text', role: message.role, content: message.content }));
                }
              }
            } else {
              // For user messages, send as-is
              if (browserWs?.readyState === WebSocket.OPEN) {
                browserWs.send(JSON.stringify({ type: 'text', role: message.role, content: message.content }));
              }
            }

            // Track YAML prompts from assistant - accumulate across messages
            if (message.role === 'assistant') {
              // Initialize YAML buffer if we see the start of a YAML block
              if (message.content.includes('```yaml')) {
                conversationState.yamlBuffer = message.content;
                console.log('🔍 YAML block started');
              } else if (conversationState.yamlBuffer && message.content.includes('```')) {
                // End of YAML block - complete the buffer
                conversationState.yamlBuffer += '\n' + message.content;
                console.log('🔚 YAML block ended, attempting extraction...');
                console.log('Complete buffer:', conversationState.yamlBuffer);
                
                const yamlContent = extractYamlFromText(conversationState.yamlBuffer);
                if (yamlContent) {
                  conversationState.lastYamlPrompt = yamlContent;
                  conversationState.phase = 'prompt_review';
                  console.log('✅ COMPLETE YAML DETECTED, entering prompt review phase');
                  console.log('YAML Content:', yamlContent);
                } else {
                  console.log('⚠️ Could not extract valid YAML from completed buffer');
                }
                conversationState.yamlBuffer = undefined;
              } else if (conversationState.yamlBuffer) {
                // Continue accumulating YAML content - don't extract yet
                conversationState.yamlBuffer += '\n' + message.content;
                console.log('📝 Accumulating YAML content...');
                
                // Check if assistant is moving on to other topics (force YAML completion)
                const movingOnPhrases = [
                  'would you like to edit',
                  'is it ready',
                  'starting code generation',
                  'great!',
                  'perfect!',
                  'let me know',
                  'you\'re welcome',
                  'if you\'re ready'
                ];
                
                const isMovingOn = movingOnPhrases.some(phrase => 
                  message.content.toLowerCase().includes(phrase)
                );
                
                if (isMovingOn) {
                  // Force complete the YAML buffer
                  console.log('🔄 Assistant moved on, force completing YAML buffer');
                  console.log('Current buffer:', conversationState.yamlBuffer);
                  const yamlContent = extractYamlFromText(conversationState.yamlBuffer);
                  if (yamlContent) {
                    conversationState.lastYamlPrompt = yamlContent;
                    conversationState.phase = 'prompt_review';
                    console.log('✅ FORCE COMPLETED YAML, entering prompt review phase');
                    console.log('YAML Content:', yamlContent);
                  } else {
                    console.log('⚠️ Could not extract YAML from buffer, clearing buffer');
                  }
                  conversationState.yamlBuffer = undefined;
                }
              } else {
                // Not in YAML buffer mode - check for complete YAML in single message
                const singleMessageYaml = extractYamlFromText(message.content);
                if (singleMessageYaml) {
                  conversationState.lastYamlPrompt = singleMessageYaml;
                  conversationState.phase = 'prompt_review';
                  console.log('✅ SINGLE MESSAGE YAML DETECTED, entering prompt review phase');
                  console.log('YAML Content:', singleMessageYaml);
                }
              }
            }

            // Detect user approval of YAML prompt
            if (message.role === 'user' && 
                conversationState.phase === 'prompt_review' && 
                conversationState.lastYamlPrompt &&
                detectYamlApproval(message.content)) {
              
              console.log('🚀 USER APPROVED YAML PROMPT, TRANSITIONING TO CODE GENERATION...');
              console.log('Current phase:', conversationState.phase);
              console.log('YAML prompt exists:', !!conversationState.lastYamlPrompt);
              console.log('User message:', message.content);
              
              conversationState.phase = 'transitioning';
              
              // Generate session ID and start code generation
              const sessionId = generateSessionId();
              conversationState.sessionId = sessionId;
              
              // Notify browser about transition
              if (browserWs?.readyState === WebSocket.OPEN) {
                browserWs.send(JSON.stringify({ 
                  type: 'phase_transition', 
                  phase: 'code_generation',
                  sessionId: sessionId
                }));
              }

              // Start code generation in background
              try {
                conversationState.phase = 'code_generation';
                console.log('🔧 Starting code generation with YAML:', conversationState.lastYamlPrompt);
                
                const result = await startCodeGeneration(
                  conversationState.lastYamlPrompt, 
                  sessionId, 
                  browserWs!
                );
                
                if (result.success) {
                  console.log(`✅ Code generation completed successfully! Preview: ${result.previewUrl}`);
                } else {
                  console.error(`❌ Code generation failed: ${result.error}`);
                  // Reset to ideation phase on failure
                  conversationState.phase = 'ideation';
                  conversationState.lastYamlPrompt = undefined;
                  conversationState.sessionId = undefined;
                }
              } catch (error) {
                console.error('❌ Error during code generation:', error);
                conversationState.phase = 'ideation';
                conversationState.lastYamlPrompt = undefined;
                conversationState.sessionId = undefined;
              }
            } else if (message.role === 'user' && 
                      (conversationState.phase === 'prompt_review' || conversationState.phase === 'ideation') &&
                      detectYamlApproval(message.content)) {
              
              // User approved but we don't have captured YAML - this shouldn't happen with improved system
              console.log('❌ APPROVAL DETECTED but no YAML captured - agent should generate complete YAML first');
              console.log('  Message:', message.content);
              console.log('  Phase:', conversationState.phase);
              console.log('  Has YAML:', !!conversationState.lastYamlPrompt);
              
              // Don't proceed without proper YAML - let the agent know it needs to generate YAML first
              if (browserWs?.readyState === WebSocket.OPEN) {
                browserWs.send(JSON.stringify({ 
                  type: 'text', 
                  role: 'system', 
                  content: 'Please generate the complete YAML first before proceeding to build.'
                }));
              }
            } else if (message.role === 'user' && conversationState.phase === 'prompt_review') {
              // Debug why approval wasn't detected
              console.log('🔍 User message in prompt_review phase but no approval detected:');
              console.log('  Message:', message.content);
              console.log('  Has YAML:', !!conversationState.lastYamlPrompt);
              console.log('  Approval check result:', detectYamlApproval(message.content));
            }
          } else if (message.type === 'Error') {
            console.error('Agent error:', message);
          } else {
            console.log('Other message:', message);
          }
        } else {
          // Handle binary audio data - send directly like Deepgram starter
          audioChunkSequence++;
          const currentTime = Date.now();
          const timeSinceLastChunk = lastAudioTimestamp ? currentTime - lastAudioTimestamp : 0;
          lastAudioTimestamp = currentTime;
          
          console.log(`🎵 [${audioChunkSequence}] Audio chunk: ${data.length} bytes, +${timeSinceLastChunk}ms since last`);
          
      if (browserWs?.readyState === WebSocket.OPEN) {
        try {
          // Send the audio buffer directly without additional conversion
              browserWs.send(data, { binary: true });
              console.log(`📤 [${audioChunkSequence}] Forwarded to browser successfully`);
        } catch (error) {
              console.error(`❌ [${audioChunkSequence}] Error sending audio to browser:`, error);
            }
          } else {
            console.warn(`⚠️ [${audioChunkSequence}] Browser WebSocket not open, dropping audio chunk`);
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    agentWs.on('error', (error: Error) => {
      console.error('Agent WebSocket error:', error);
    });

    agentWs.on('close', () => {
      console.log('Agent connection closed');
      if (browserWs?.readyState === WebSocket.OPEN) {
        browserWs.close();
      }
    });

    // Return an object that mimics the agent interface
    return {
      send: (data: Buffer) => {
        if (agentWs.readyState === WebSocket.OPEN) {
          agentWs.send(data);
        }
      },
      disconnect: async () => {
        agentWs.close();
      }
    };
  } catch (error) {
    console.error('Error connecting to Deepgram:', error);
    process.exit(1);
  }
}

// Create WebSocket server for browser clients
const wss = new WebSocketServer({ server });
let browserWs: WebSocket | null = null;
let connectionCount = 0;

wss.on('connection', async (ws) => {
  connectionCount++;
  console.log(`🔌 Browser client connected (connection #${connectionCount})`);
  
  // Check if there's already a browser connection
  if (browserWs && browserWs.readyState === WebSocket.OPEN) {
    console.warn('⚠️ Multiple browser connections detected! Closing previous connection.');
    browserWs.close();
  }
  
  browserWs = ws;

  // Reset conversation state for new connection
  conversationState = { phase: 'ideation' };

  const agent = await connectToAgent();

  ws.on('message', (data: Buffer) => {
    try {
      if (agent) {
        agent.send(data);
      }
    } catch (error) {
      console.error('Error sending audio to agent:', error);
    }
  });

  ws.on('close', async () => {
    console.log(`🔌 Browser client disconnected (connection #${connectionCount})`);
    if (agent) {
      await agent.disconnect();
    }
    if (browserWs === ws) {
    browserWs = null;
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
const serverInstance = server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown handler
function shutdown() {
  console.log('\nShutting down server...');

  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExit = setTimeout(() => {
    console.error('Force closing due to timeout');
    process.exit(1);
  }, 5000);

  // Track pending operations
  let pendingOps = {
    ws: true,
    http: true
  };

  // Function to check if all operations are complete
  const checkComplete = () => {
    if (!pendingOps.ws && !pendingOps.http) {
      clearTimeout(forceExit);
      console.log('Server shutdown complete');
      process.exit(0);
    }
  };

  // Close all WebSocket connections
  wss.clients.forEach((client) => {
    try {
      client.close();
    } catch (err) {
      console.error('Error closing WebSocket client:', err);
    }
  });

  wss.close((err) => {
    if (err) {
      console.error('Error closing WebSocket server:', err);
    } else {
      console.log('WebSocket server closed');
    }
    pendingOps.ws = false;
    checkComplete();
  });

  // Close the HTTP server
  serverInstance.close((err) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
    } else {
      console.log('HTTP server closed');
    }
    pendingOps.http = false;
    checkComplete();
  });
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default serverInstance;
import { createClient, AgentEvents } from '@deepgram/sdk';
import { WebSocket, WebSocketServer } from 'ws';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { startCodeGeneration } from './codeGen';

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

// Function to extract YAML from conversation text
function extractYamlFromText(text: string): string | null {
  const yamlMatch = text.match(/```yaml\n([\s\S]*?)\n```/);
  if (yamlMatch) {
    return yamlMatch[1].trim();
  }
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
    'approved',
    'correct',
    'that\'s right',
    'sounds good'
  ];
  
  const lowerMessage = userMessage.toLowerCase().trim();
  const isApproval = approvalPhrases.some(phrase => lowerMessage.includes(phrase));
  
  if (isApproval) {
    console.log(`🎯 APPROVAL DETECTED: "${userMessage}" matches approval phrases`);
  }
  
  return isApproval;
}

// Function to generate a session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create HTTP server to serve the static HTML file
const server = http.createServer((req, res) => {
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
  }
});

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
          sample_rate: 16000
        },
        output: {
          encoding: 'linear16',
          sample_rate: 16000,
          container: 'none'
        }
      },
      agent: {
        listen: {
          provider: {
            type: 'deepgram',
            model: 'nova-3'
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
          prompt: `You are a collaborative voice agent helping the user shape a web-application idea.

Your mission phases:
1. IDEATION
2. PROMPT REVIEW

During IDEATION ask focused follow-up questions, ONE at a time, to discover:
• App idea & purpose
• Target users / use-cases
• Core features & pain-points
• Preferred tech stack & design style

When you have enough detail (usually after 6-8 answers), transition to PROMPT REVIEW by generating a YAML document with EXACTLY this shape:

\`\`\`yaml
project_name: <string>
project_description: |
  <multi-line description>
users:
  - <user one>
  - <user two>
goal:
  - <goal one>
features:
  - <feature one>
  - <feature two>
tech_stack:
  frontend: <string>
  backend: <string>   # omit if none
ui_style: <string>
\`\`\`

Read the YAML aloud, then explicitly ask: "Would you like to edit this prompt or is it ready?"

If the user wants changes, keep iterating—NEVER advance to code generation until they clearly approve the prompt.

When the user approves the prompt (says "looks good", "yes", "ready", etc.), simply acknowledge their approval with a brief response like "Great! Starting code generation now..." and then STOP. The system will automatically transition to code generation.

General rules:
• Responses should be friendly and concise (≤ 2 sentences) EXCEPT when reading the YAML.
• Always keep the user involved – use "we" and "let's".
• Never generate code; only conversation or the YAML prompt.
• After user approval, acknowledge briefly and stop talking.`
        },
        speak: {
          provider: {
            type: 'deepgram',
            model: 'aura-2-arcas-en'
          }
        },
        greeting: "Hello! How can I help you today?"
      }
    };

    agentWs.send(JSON.stringify(settings));

    // Set up message handler
    agentWs.on('message', async (data: Buffer) => {
      try {
        // Better detection of JSON vs binary data
        const dataStr = data.toString('utf8');
        let isJson = false;
        
        try {
          // Try to parse as JSON first
          JSON.parse(dataStr);
          isJson = true;
        } catch {
          // Not JSON, treat as binary audio data
          isJson = false;
        }

        if (isJson) {
          // Handle JSON messages
          const message = JSON.parse(dataStr);
          console.log('Received message:', message.type);

          if (message.type === 'Welcome') {
            console.log('Server welcome message:', message);
          } else if (message.type === 'SettingsApplied') {
            console.log('Server confirmed settings:', message);
          } else if (message.type === 'ConversationText') {
            // Log and forward the conversation text to browser
            console.log(`${message.role}: ${message.content}`);
            if (browserWs?.readyState === WebSocket.OPEN) {
              browserWs.send(JSON.stringify({ type: 'text', role: message.role, content: message.content }));
            }

            // Track YAML prompts from assistant - accumulate across messages
            if (message.role === 'assistant') {
              // Initialize YAML buffer if we see the start of a YAML block
              if (message.content.includes('```yaml')) {
                conversationState.yamlBuffer = message.content;
                console.log('🔍 YAML block started');
              } else if (conversationState.yamlBuffer && message.content.includes('```')) {
                // End of YAML block
                conversationState.yamlBuffer += '\n' + message.content;
                const yamlContent = extractYamlFromText(conversationState.yamlBuffer);
                if (yamlContent) {
                  conversationState.lastYamlPrompt = yamlContent;
                  conversationState.phase = 'prompt_review';
                  console.log('✅ COMPLETE YAML DETECTED, entering prompt review phase');
                  console.log('YAML Content:', yamlContent);
                }
                conversationState.yamlBuffer = undefined;
              } else if (conversationState.yamlBuffer) {
                // Continue accumulating YAML content
                conversationState.yamlBuffer += '\n' + message.content;
                console.log('📝 Accumulating YAML content...');
              }
              
              // Also check for complete YAML in single message
              const singleMessageYaml = extractYamlFromText(message.content);
              if (singleMessageYaml && !conversationState.yamlBuffer) {
                conversationState.lastYamlPrompt = singleMessageYaml;
                conversationState.phase = 'prompt_review';
                console.log('✅ SINGLE MESSAGE YAML DETECTED, entering prompt review phase');
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
                  from: 'ideation', 
                  to: 'code_generation',
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
          // Handle binary audio data
          if (browserWs?.readyState === WebSocket.OPEN) {
            try {
              // Send the audio buffer directly without additional conversion
              browserWs.send(data, { binary: true });
            } catch (error) {
              console.error('Error sending audio to browser:', error);
            }
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

wss.on('connection', async (ws) => {
  // Only log critical connection events
  console.log('Browser client connected');
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
    if (agent) {
      await agent.disconnect();
    }
    browserWs = null;
    console.log('Browser client disconnected');
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
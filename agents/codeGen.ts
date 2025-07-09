/**
 * CODE GENERATION AGENT - Orchestration Layer
 * 
 * This agent handles Phase 3 (Code Generation) of the voice-to-code workflow.
 * It sits between the ideation agent and the Replit codegen utility, providing:
 * - State management & session tracking
 * - YAML validation & preprocessing  
 * - Event routing & WebSocket management
 * - Error handling & recovery
 * - Integration bridge from chat mode to preview mode
 */

import { WebSocket } from 'ws';
import { runClaudeCodegen } from '../utils/claudeCodegen';
import * as fs from 'fs';
import * as path from 'path';

interface GenerationSession {
  status: 'starting' | 'generating' | 'building' | 'ready' | 'error' | 'cancelled';
  startTime: Date;
  yamlPrompt?: string;
  previewUrl?: string;
  repoPath?: string;
  cancelFn?: () => void;
}

// Track active code generation sessions
const activeGenerations = new Map<string, GenerationSession>();

interface YamlStructure {
  project_name?: string;
  project_description?: string;
  users?: string[];
  features?: string[];
  tech_stack?: {
    frontend?: string;
    backend?: string;
    database?: string;
  };
  ui_style?: string;
}

/**
 * Validates and preprocesses YAML prompt before sending to Replit
 */
function validateYamlPrompt(yamlText: string): { isValid: boolean; errors: string[]; processed?: string } {
  const errors: string[] = [];
  
  try {
    // Basic YAML structure validation (simple approach)
    if (!yamlText.includes('project_name:')) {
      errors.push('Missing required field: project_name');
    }
    if (!yamlText.includes('features:')) {
      errors.push('Missing required field: features');
    }
    if (!yamlText.includes('tech_stack:')) {
      errors.push('Missing required field: tech_stack');
    }
    
    // Add default values if missing
    let processed = yamlText;
    if (!yamlText.includes('ui_style:')) {
      processed += '\nui_style: Clean and modern';
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      processed: errors.length === 0 ? processed : undefined
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Cleans up generated files and folders for a session
 */
function cleanupSession(sessionId: string): void {
  const genDir = path.join(process.cwd(), 'generated', sessionId);
  if (fs.existsSync(genDir)) {
    fs.rmSync(genDir, { recursive: true, force: true });
  }
}

/**
 * Sends a structured event to the browser via WebSocket
 */
function emitEvent(browserWs: WebSocket, type: string, sessionId: string, data: any = {}): void {
  if (browserWs.readyState === WebSocket.OPEN) {
    browserWs.send(JSON.stringify({
      type,
      sessionId,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
}

/**
 * Main entry point: starts code generation for an approved YAML prompt
 */
export async function startCodeGeneration(
  yamlPrompt: string, 
  sessionId: string, 
  browserWs: WebSocket
): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  
  // Initialize session tracking
  const session: GenerationSession = {
    status: 'starting',
    startTime: new Date(),
    yamlPrompt
  };
  activeGenerations.set(sessionId, session);
  
  emitEvent(browserWs, 'codegen-start', sessionId, { yamlPrompt });
  
  try {
    // Step 1: Validate YAML
    const validation = validateYamlPrompt(yamlPrompt);
    if (!validation.isValid) {
      throw new Error(`YAML validation failed: ${validation.errors.join(', ')}`);
    }
    
    session.status = 'generating';
    emitEvent(browserWs, 'codegen-validation-passed', sessionId);
    
    // Step 2: Call Replit codegen with event streaming
    const result = await runClaudeCodegen(validation.processed!, sessionId, {
      onLog: (chunk: string) => {
        emitEvent(browserWs, 'codegen-log', sessionId, { chunk });
      },
      onFileTree: (tree: any) => {
        emitEvent(browserWs, 'codegen-file-tree', sessionId, { tree });
      },
      onPreviewReady: (url: string) => {
        session.status = 'ready';
        session.previewUrl = url;
        emitEvent(browserWs, 'codegen-preview-ready', sessionId, { url });
      },
      onError: (error: Error) => {
        session.status = 'error';
        emitEvent(browserWs, 'codegen-error', sessionId, { error: error.message });
      }
    });
    
    // Step 3: Success
    session.repoPath = result.repoPath;
    emitEvent(browserWs, 'codegen-complete', sessionId, { 
      previewUrl: result.previewUrl,
      repoPath: result.repoPath,
      duration: Date.now() - session.startTime.getTime()
    });
    
    return { success: true, previewUrl: result.previewUrl };
    
  } catch (error) {
    // Step 4: Error handling
    session.status = 'error';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    emitEvent(browserWs, 'codegen-error', sessionId, { 
      error: errorMessage,
      duration: Date.now() - session.startTime.getTime()
    });
    
    // Cleanup on error
    cleanupSession(sessionId);
    activeGenerations.delete(sessionId);
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Cancels an ongoing code generation session
 */
export function cancelCodeGeneration(sessionId: string, browserWs: WebSocket): boolean {
  const session = activeGenerations.get(sessionId);
  if (!session) return false;
  
  session.status = 'cancelled';
  session.cancelFn?.();
  
  emitEvent(browserWs, 'codegen-cancelled', sessionId);
  cleanupSession(sessionId);
  activeGenerations.delete(sessionId);
  
  return true;
}

/**
 * Gets the current status of a code generation session
 */
export function getGenerationStatus(sessionId: string): GenerationSession | null {
  return activeGenerations.get(sessionId) || null;
}

/**
 * Lists all active generation sessions (for debugging/monitoring)
 */
export function getActiveGenerations(): Map<string, GenerationSession> {
  return new Map(activeGenerations);
}

/**
 * Cleanup old/stale sessions (call periodically)
 */
export function cleanupStaleGenerations(maxAgeMinutes: number = 30): number {
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  let cleaned = 0;
  
  for (const [sessionId, session] of activeGenerations.entries()) {
    if (session.startTime < cutoff && session.status !== 'ready') {
      cleanupSession(sessionId);
      activeGenerations.delete(sessionId);
      cleaned++;
    }
  }
  
  return cleaned;
}

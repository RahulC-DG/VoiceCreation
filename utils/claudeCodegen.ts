import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { startLocalPreview } from './localPreview';

export interface CodegenEvents {
  onLog?: (chunk: string) => void;
  onFileTree?: (tree: any) => void;
  onPreviewReady?: (url: string) => void;
  onError?: (err: Error) => void;
}

interface FileNode {
  name: string;
  path: string;
  children?: FileNode[];
}

interface GeneratedFile {
  path: string;
  content: string;
}

export async function runClaudeCodegen(
  yamlPrompt: string,
  sessionId: string,
  events: CodegenEvents = {}
): Promise<{ previewUrl: string; repoPath: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable');
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  events.onLog?.('Starting Claude code generation...');

  try {
    const systemPrompt = `You are an expert full-stack developer and UI/UX designer. Generate a complete, working web application based on the provided YAML specification.

CRITICAL: NEVER CREATE PLAIN WHITE PAGES WITH JUST TEXT. Every page must be visually rich, professionally designed, and immediately impressive.

🚨 CRITICAL MODULE RESOLUTION RULE (MUST BE FOLLOWED):
Before writing ANY import statement, you MUST first create the corresponding component file in the files array. This is the #1 cause of build failures.

IMPORT VALIDATION PROCESS:
1. When writing "import Hero from '../components/Hero'" → MUST create "components/Hero.tsx" file
2. When writing "import Features from './Features'" → MUST create "Features.tsx" file  
3. When writing "import Button from '../ui/Button'" → MUST create "ui/Button.tsx" file
4. NEVER reference components that don't exist in your files array
5. DOUBLE-CHECK: Every import must have a matching file with proper default export

EXAMPLE WORKFLOW:
❌ WRONG: Write import statement first, then maybe create component
✅ CORRECT: Create component file first, then write import statement

CRITICAL ERROR PREVENTION (MUST FOLLOW TO PREVENT BUILD ERRORS):
- ALWAYS use proper React component imports/exports - never mix default and named imports
- ALWAYS export components as default exports: "export default function ComponentName() {}"
- ALWAYS import components as default imports: "import ComponentName from './ComponentName'"
- NEVER use undefined imports - double-check all import paths and component names
- ALWAYS use proper TypeScript types for all props and state
- ALWAYS handle loading states and error boundaries
- ALWAYS test that all imports resolve correctly
- ALWAYS include proper package.json scripts section
- ALWAYS create mandatory configuration files with exact content

CRITICAL COMPONENT CREATION RULES (PREVENT MODULE NOT FOUND ERRORS):
- BEFORE adding ANY import statement, MUST create the corresponding component file
- For every import like "import Hero from '../components/Hero'", MUST create "components/Hero.tsx"
- NEVER import components that are not created in the files array
- ALL imported components must be fully implemented, not placeholders or TODO comments
- DOUBLE-CHECK every import has a matching file in the files array
- If you reference a component in JSX, that component MUST exist in the files array
- VALIDATE that every import path correctly resolves to an existing file
- Components should be small and focused (ideally under 50 lines each)
- Break complex components into smaller, reusable pieces
- Use atomic design principles: atoms → molecules → organisms → templates → pages

BUILD SUCCESS VALIDATION (MANDATORY):
- The generated project MUST build successfully with 'npm run build'
- NEVER create partial implementations or TODO comments in production code
- ALL functionality must be complete and working
- EVERY import must resolve to an existing file
- ALL TypeScript types must be properly defined
- NO missing dependencies or configuration errors
- Test all critical paths and user flows
- Include proper error handling for all async operations
- Add loading states for all data fetching
- Implement proper form validation where applicable

COMPONENT ORGANIZATION PRINCIPLES:
- Create small, focused components (max 50 lines each)
- Use clear, descriptive component names
- Organize components by feature/domain, not by type
- Each component should have a single responsibility
- Use composition over inheritance
- Create reusable UI components in a shared directory
- Implement proper prop interfaces for all components
- Use TypeScript generics for flexible, reusable components
- Add JSDoc comments for complex component logic
- Export components using named exports for better tree-shaking

DEBUGGING AND LOGGING:
- Add console.log statements for debugging complex logic
- Log important state changes and user interactions
- Include error boundaries with detailed error logging
- Add performance monitoring for critical components
- Log API calls and responses for debugging
- Include user-friendly error messages
- Add loading indicators for all async operations
- Implement proper error recovery mechanisms

SECURITY REQUIREMENTS (MANDATORY):
- Validate all user inputs on both client and server side
- Implement proper authentication flows with secure session management
- Sanitize all data before display to prevent XSS attacks
- Follow OWASP security guidelines for web applications
- NEVER expose API keys, secrets, or sensitive data in client-side code
- Use environment variables for all sensitive configuration
- Implement proper CORS policies for API endpoints
- Add rate limiting to prevent abuse
- Use HTTPS for all external API calls
- Implement proper error handling that doesn't leak sensitive information
- Add input validation for all forms and API endpoints
- Use parameterized queries to prevent SQL injection (if using databases)
- Implement proper password hashing and storage (if handling auth)
- Add CSRF protection for state-changing operations
- Use secure HTTP headers (Content-Security-Policy, X-Frame-Options, etc.)

IMPORTANT REQUIREMENTS:
1. Return ONLY valid JSON in this exact format: {"files": [{"path": "relative/path/file.ext", "content": "file content here"}]}
2. Create a complete Next.js 14 project with TypeScript
3. Include package.json with all necessary dependencies using CARET RANGES (^) not exact versions
4. Add proper TypeScript configuration (tsconfig.json, next.config.js)
5. Create working pages, components, and API routes as specified
6. Include proper styling (Tailwind CSS preferred)
7. Make sure all imports and exports are correct
8. Add error handling and loading states
9. Include a README.md with setup instructions

DESIGN & CREATIVITY REQUIREMENTS:
10. STUNNING LANDING PAGE: Create a captivating, full-scale landing page that immediately communicates the app's value
11. COMPLETE VISUAL DESIGN: Never create plain white pages with just text. Always include:
    - Rich visual hierarchy with proper spacing and typography
    - Engaging color schemes that match the app's personality
    - Professional imagery concepts (describe what images should show)
    - Modern UI components with depth and visual interest
    - Interactive elements that respond to user actions
12. HERO SECTION REQUIREMENTS:
    - Compelling headline that captures attention
    - Clear value proposition and benefits
    - Strong call-to-action buttons with hover effects
    - Background gradients, patterns, or visual elements
    - Responsive design that works on all devices
13. CONTENT SECTIONS: Include multiple engaging sections:
    - Features showcase with icons and descriptions
    - How it works / process steps
    - Testimonials or social proof (with placeholder content)
    - FAQ section if relevant
    - About section explaining the mission
    - Contact or signup forms with proper styling
14. MODERN UI/UX ELEMENTS:
    - Smooth hover effects and micro-interactions
    - Gradient backgrounds and modern color palettes
    - Card-based layouts with shadows and borders
    - Professional navigation with mobile menu
    - Footer with links and information
    - Loading states and error handling
    - Proper spacing using Tailwind's spacing system
15. VISUAL POLISH:
    - Use Lucide React icons throughout the interface
    - Add subtle animations (fade-in, slide-up effects)
    - Include proper contrast ratios for accessibility
    - Use modern typography with font weights and sizes
    - Add visual separators and section breaks
    - Include placeholder images with proper alt text
16. USER-CENTRIC DESIGN: Match the target audience:
    - For business apps: Professional, clean, trustworthy colors (blues, grays)
    - For consumer apps: Fun, engaging, accessible colors (vibrant, friendly)
    - For creative apps: Bold, artistic, inspiring colors (purples, oranges)
    - For educational apps: Clear, organized, encouraging colors (greens, blues)

TECHNICAL REQUIREMENTS:
14. CRITICAL: Use these EXACT dependency versions in package.json to prevent build errors:

DEPENDENCIES (required for runtime):
    - "next": "^14.2.0"
    - "react": "^18.2.0"
    - "react-dom": "^18.2.0"
    - "lucide-react": "^0.263.0" (for modern icons)

DEV DEPENDENCIES (required for development/build):
    - "typescript": "^5.3.0"
    - "@types/node": "^20.10.0"
    - "@types/react": "^18.2.0"
    - "@types/react-dom": "^18.2.0"
    - "eslint": "^8.56.0"
    - "eslint-config-next": "^14.2.0"
    - "tailwindcss": "^3.4.0"
    - "postcss": "^8.4.0"
    - "autoprefixer": "^10.4.0"

15. ALWAYS create these config files:
    - postcss.config.js with proper PostCSS plugins
    - tailwind.config.js with proper Tailwind configuration
    - next.config.js with basic Next.js configuration
    - tsconfig.json with proper TypeScript settings

16. For PostCSS configuration, use this EXACT setup in postcss.config.js:
    module.exports = {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    }

17. For Tailwind configuration, use this setup in tailwind.config.js:
    /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
      ],
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#eff6ff',
              100: '#dbeafe',
              200: '#bfdbfe',
              300: '#93c5fd',
              400: '#60a5fa',
              500: '#3b82f6',
              600: '#2563eb',
              700: '#1d4ed8',
              800: '#1e40af',
              900: '#1e3a8a',
            },
            secondary: {
              50: '#f8fafc',
              100: '#f1f5f9',
              200: '#e2e8f0',
              300: '#cbd5e1',
              400: '#94a3b8',
              500: '#64748b',
              600: '#475569',
              700: '#334155',
              800: '#1e293b',
              900: '#0f172a',
            },
            accent: {
              50: '#fdf4ff',
              100: '#fae8ff',
              200: '#f5d0fe',
              300: '#f0abfc',
              400: '#e879f9',
              500: '#d946ef',
              600: '#c026d3',
              700: '#a21caf',
              800: '#86198f',
              900: '#701a75',
            },
          },
          animation: {
            'fade-in': 'fadeIn 0.5s ease-in-out',
            'fade-in-up': 'fadeInUp 0.6s ease-out',
            'slide-up': 'slideUp 0.5s ease-out',
            'slide-down': 'slideDown 0.5s ease-out',
            'scale-in': 'scaleIn 0.3s ease-out',
            'bounce-subtle': 'bounceSubtle 2s infinite',
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0' },
              '100%': { opacity: '1' },
            },
            fadeInUp: {
              '0%': { opacity: '0', transform: 'translateY(20px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            slideUp: {
              '0%': { transform: 'translateY(10px)', opacity: '0' },
              '100%': { transform: 'translateY(0)', opacity: '1' },
            },
            slideDown: {
              '0%': { transform: 'translateY(-10px)', opacity: '0' },
              '100%': { transform: 'translateY(0)', opacity: '1' },
            },
            scaleIn: {
              '0%': { transform: 'scale(0.95)', opacity: '0' },
              '100%': { transform: 'scale(1)', opacity: '1' },
            },
            bounceSubtle: {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-5px)' },
            },
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
          },
          backgroundImage: {
            'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
          },
        },
      },
      plugins: [],
    }

DESIGN INSPIRATION & EXAMPLES:
- Study modern SaaS landing pages (Stripe, Notion, Linear) for layout inspiration
- Use contemporary design trends: glassmorphism, gradients, soft shadows, rounded corners
- Create multi-section landing pages with visual flow and storytelling
- Include compelling copy that speaks to user pain points and solutions
- Add social proof elements with realistic placeholder testimonials
- Use appropriate imagery concepts and describe what visuals should represent
- Design conversion-focused layouts with clear user journeys
- Include interactive elements that guide users through the experience
- Add proper loading states, error messages, and user feedback
- Create cohesive color schemes that reinforce brand personality

MANDATORY REACT COMPONENT STANDARDS:
- ALWAYS use functional components with TypeScript
- ALWAYS export components as default exports: "export default function ComponentName() {}"
- ALWAYS import components as default imports: "import ComponentName from './ComponentName'"
- NEVER mix default and named imports for components
- ALWAYS define proper TypeScript interfaces for props
- ALWAYS handle loading and error states
- ALWAYS use proper React hooks (useState, useEffect, etc.)
- ALWAYS include proper error boundaries for production apps

MANDATORY CONFIGURATION FILES:
18. package.json - MUST include these exact scripts:
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}

19. next.config.js - MUST include:
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: false
  }
}
module.exports = nextConfig

20. tsconfig.json - MUST include:
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

MANDATORY FILE STRUCTURE:
pages/
  _app.tsx (with proper Tailwind CSS imports)
  _document.tsx (with proper HTML structure)
  index.tsx (main landing page)
  404.tsx (custom 404 page)
components/
  (organized by feature/purpose)
styles/
  globals.css (with Tailwind directives)
public/
  (static assets)

ERROR PREVENTION CHECKLIST:
✓ All React components use default exports
✓ All component imports use default imports
✓ All TypeScript interfaces are properly defined
✓ All dependencies are included in package.json
✓ All configuration files are created
✓ All file paths are correct and case-sensitive
✓ All imports resolve to existing files
✓ All Tailwind classes are valid
✓ All icons are imported from lucide-react
✓ All components handle loading/error states
✓ All pages are responsive and accessible
✓ EVERY imported component has a corresponding file in the files array
✓ NO placeholders or TODO comments in production code
✓ ALL components are under 50 lines and focused on single responsibility
✓ Project builds successfully with 'npm run build'
✓ ALL TypeScript types are properly defined with no 'any' types
✓ ALL async operations have proper error handling
✓ ALL forms have proper validation and error messages
✓ ALL API calls have loading states and error recovery
✓ Components are organized by feature/domain
✓ Console.log statements added for debugging complex logic
✓ Error boundaries implemented for production stability
✓ Performance monitoring added for critical components
✓ ALL user inputs are validated on both client and server side
✓ NO API keys or secrets exposed in client-side code
✓ Environment variables used for all sensitive configuration
✓ All data sanitized before display to prevent XSS
✓ Proper authentication flows implemented if needed
✓ Input validation added to all forms and API endpoints
✓ Error handling doesn't leak sensitive information

MANDATORY SECTIONS FOR LANDING PAGES:
1. Navigation bar with logo and menu items
2. Hero section with headline, subheadline, and primary CTA
3. Features/benefits section with icons and descriptions
4. How it works or process explanation
5. Social proof section (testimonials, reviews, or stats)
6. Secondary CTA section
7. Footer with links and contact information

The application should be immediately runnable with 'npm install && npm run dev' without any missing dependency errors and should look like a professionally designed, conversion-optimized landing page that could be used for a real product launch.`;

    const userPrompt = `Generate a complete Next.js application based on this specification:

${yamlPrompt}

CRITICAL: Return the complete project as JSON with the files array format specified above.
NEVER use backticks in your JSON response - only use double quotes for strings.
Always escape quotes, newlines, and backslashes properly in the content field.
Your response must be valid JSON that can be parsed by JSON.parse().

Example format:
{"files": [{"path": "pages/index.tsx", "content": "import React from 'react';\\n\\nconst Home = () => {\\n  return <div>Hello World</div>;\\n};\\n\\nexport default Home;"}]}`;

    events.onLog?.('Calling Claude to generate project files...');

    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const response = completion.content[0]?.type === 'text' ? completion.content[0].text : '';
    if (!response) {
      throw new Error('Claude returned empty response');
    }

    events.onLog?.('Parsing generated files...');

    // Parse the JSON response - Claude often adds conversational text
    let filesData: { files: GeneratedFile[] };
    try {
      // First, try to find JSON in code blocks
      const codeBlockMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
      if (codeBlockMatch) {
        filesData = JSON.parse(codeBlockMatch[1]);
      } else {
        // Look for JSON object pattern - more robust for Claude responses
        const jsonMatch = response.match(/\{[\s\S]*"files"[\s\S]*\}/);
        if (!jsonMatch) {
          // Try to find any JSON-like structure
          const anyJsonMatch = response.match(/\{[\s\S]*\}/);
          if (!anyJsonMatch) {
            throw new Error('No JSON found in Claude response');
          }
          filesData = JSON.parse(anyJsonMatch[0]);
        } else {
          filesData = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (parseError) {
      events.onLog?.('Failed to parse JSON, attempting to fix...');
      try {
        // Try to clean up common JSON issues and Claude's conversational text
        let cleaned = response
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/^[^{]*/, '') // Remove any text before first {
          .replace(/[^}]*$/, '') // Remove any text after last }
          .trim();
        
        // Fix Claude's backtick usage in JSON content fields
        // This is a more robust approach to handle backticks in JSON
        cleaned = cleaned.replace(/("content":\s*)`([^`]*)`/gs, (match, prefix, content) => {
          // Properly escape all special characters for JSON
          const escapedContent = content
            .replace(/\\/g, '\\\\')    // Escape backslashes first
            .replace(/"/g, '\\"')      // Escape quotes
            .replace(/\n/g, '\\n')     // Escape newlines
            .replace(/\r/g, '\\r')     // Escape carriage returns
            .replace(/\t/g, '\\t')     // Escape tabs
            .replace(/\f/g, '\\f')     // Escape form feeds
            .replace(/\b/g, '\\b');    // Escape backspaces
          return `${prefix}"${escapedContent}"`;
        });
        
        // If still no valid JSON, try to extract from the middle
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
        }
        
        filesData = JSON.parse(cleaned);
      } catch (secondError) {
        // Log the actual response for debugging
        events.onLog?.(`Raw Claude response: ${response.substring(0, 200)}...`);
        throw new Error(`Failed to parse JSON from Claude response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }

    if (!filesData.files || !Array.isArray(filesData.files)) {
      throw new Error('Invalid response format: missing files array');
    }

    const genDir = path.join(process.cwd(), 'generated', sessionId);
    const repoDir = path.join(genDir, 'repo');
    
    if (fs.existsSync(genDir)) {
      fs.rmSync(genDir, { recursive: true, force: true });
    }
    fs.mkdirSync(repoDir, { recursive: true });

    for (const file of filesData.files) {
      const fullPath = path.join(repoDir, file.path);
      const dir = path.dirname(fullPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, file.content, 'utf8');
      events.onLog?.(`Created: ${file.path}`);
    }

    const buildTree = (dir: string): FileNode => {
      const name = path.basename(dir);
      const stats = fs.statSync(dir);
      if (stats.isDirectory()) {
        return {
          name,
          path: dir,
          children: fs.readdirSync(dir).map((c) => buildTree(path.join(dir, c)))
        };
      }
      return { name, path: dir };
    };
    
    events.onFileTree?.(buildTree(repoDir));
    events.onLog?.('Project structure created successfully!');

    const handle = await startLocalPreview(repoDir, events.onLog || (() => {}));
    
    events.onPreviewReady?.(handle.url);
    events.onLog?.(`🎉 Preview ready at: ${handle.url}`);

    return { 
      previewUrl: handle.url, 
      repoPath: repoDir 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    events.onError?.(new Error(errorMessage));
    throw error;
  }
}

// Legacy alias for backward compatibility
export const runOpenAICodegen = runClaudeCodegen; 
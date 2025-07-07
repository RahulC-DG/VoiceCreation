import OpenAI from 'openai';
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

/**
 * Generate code using OpenAI GPT-4 and preview it locally.
 * Maintains the same interface as the original Replit integration.
 */
export async function runOpenAICodegen(
  yamlPrompt: string,
  sessionId: string,
  events: CodegenEvents = {}
): Promise<{ previewUrl: string; repoPath: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  // Initialize OpenAI client inside the function after env check
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  events.onLog?.('Starting OpenAI code generation...');

  try {
    // Step 1: Generate the project structure and files
    const systemPrompt = `You are an expert full-stack developer and UI/UX designer. Generate a complete, working web application based on the provided YAML specification.

CRITICAL: NEVER CREATE PLAIN WHITE PAGES WITH JUST TEXT. Every page must be visually rich, professionally designed, and immediately impressive.

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

Return the complete project as JSON with the files array format specified above.`;

    events.onLog?.('Calling OpenAI GPT-4 to generate project files...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 8000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('OpenAI returned empty response');
    }

    events.onLog?.('Parsing generated files...');

    // Parse the JSON response
    let filesData: { files: GeneratedFile[] };
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in OpenAI response');
      }
      filesData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      events.onLog?.('Failed to parse JSON, attempting to fix...');
      // Try to clean up common JSON issues
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      filesData = JSON.parse(cleaned);
    }

    if (!filesData.files || !Array.isArray(filesData.files)) {
      throw new Error('Invalid response format: missing files array');
    }

    events.onLog?.(`Generated ${filesData.files.length} files. Creating project structure...`);

    // Step 2: Create the project directory structure
    const genDir = path.join(process.cwd(), 'generated', sessionId);
    const repoDir = path.join(genDir, 'repo');
    
    // Clean up any existing directory
    if (fs.existsSync(genDir)) {
      fs.rmSync(genDir, { recursive: true, force: true });
    }
    fs.mkdirSync(repoDir, { recursive: true });

    // Step 3: Write all files to disk
    for (const file of filesData.files) {
      const fullPath = path.join(repoDir, file.path);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      fs.mkdirSync(dir, { recursive: true });
      
      // Write file content
      fs.writeFileSync(fullPath, file.content, 'utf8');
      events.onLog?.(`Created: ${file.path}`);
    }

    // Step 4: Build file tree for frontend
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

    // Step 5: Start local preview
    events.onLog?.('Starting local development server...');
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

// Export with the same name for drop-in replacement
export const runReplitCodegen = runOpenAICodegen; 
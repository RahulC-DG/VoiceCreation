# VocalFlow 🎙️

**Empowering Everyone to Build with Voice**

In a world where technology should serve everyone, not just those who speak code, VocalFlow breaks down the barriers between imagination and creation. This isn't just another development tool—it's a bridge that allows anyone, regardless of technical background, to bring their digital dreams to life through the most natural interface we have: our voice.

Whether you're a small business owner with a game-changing idea, a teacher who wants to create educational tools, or simply someone who sees a problem that technology could solve, VocalFlow believes that your vision matters. You shouldn't need to learn programming languages, understand complex frameworks, or hire expensive developers to turn your ideas into reality. Just speak naturally about what you want to build, and watch as AI transforms your words into professional, fully-functional web applications.

This is technology as it should be: intuitive, accessible, and empowering. Your voice is your code, your ideas are your blueprint, and your imagination is the only limit.

---

A voice-first AI assistant that helps users design and build web applications through natural conversation. Simply describe your app idea by speaking, and watch as the AI generates a complete, professionally designed web application with real-time visual progress feedback.

## 🌟 Latest Enhancements

### **🧠 Enhanced AI Interaction**
- **Problem-Focused AI**: The AI now acts as an innovative problem-solving partner that challenges your assumptions and pushes for breakthrough solutions
- **Provocative Questions**: AI asks challenging questions like "What assumption is everyone making that you could prove wrong?" and "What would make this 10x better than existing solutions?"
- **Faster Conversations**: Reduced from 7-8 exchanges to just 3-4 focused exchanges
- **Smart Responsiveness**: AI detects readiness signals like "let's build this" and "I'm ready" to move forward quickly
- **No Repetition**: AI never repeats questions, keeping conversations fresh and efficient

### **📊 Visual Progress System**
- **Real-Time Progress Bar**: Elegant oval progress indicator (200px x 20px) positioned next to the VocalFlow branding
- **Dynamic Status Words**: Rotating status words that change every 1.5 seconds per phase:
  - **Ideation**: "Discovering" → "Exploring" → "Analyzing" → "Investigating"
  - **Prompt Review**: "Designing" → "Planning" → "Structuring" → "Crafting"
  - **Code Generation**: "Building" → "Creating" → "Generating" → "Coding"
  - **Voice Editing**: "Refining" → "Polishing" → "Enhancing" → "Perfecting"
- **Accelerated Progress**: 10x message multiplier with 30% maximum progress within each phase
- **Always Visible**: Minimum 10% progress shown, floating below the header for constant visibility

### **🔒 Advanced YAML Handling**
- **Intelligent YAML Processing**: System processes YAML specifications silently in the background
- **Clean User Experience**: YAML content is completely hidden from users while still being processed by the system
- **Aggressive Filtering**: Advanced detection patterns block any YAML content from being displayed or spoken
- **Seamless Flow**: Users experience smooth transitions without technical interruptions

## 🛠️ Complete Technical Stack

### **Core Technologies**
- **Runtime**: Node.js 18+ (JavaScript/TypeScript execution environment)
- **Frontend Framework**: Next.js 14 (React-based full-stack framework)
- **UI Library**: React 18 (Component-based user interface)
- **Language**: TypeScript (Type-safe JavaScript)
- **Styling**: Tailwind CSS (Utility-first CSS framework)
- **Icons**: Lucide React (Modern icon library)

### **AI & Voice Processing**
- **Language Model**: OpenAI GPT-4 (Advanced text generation and reasoning)
- **Speech-to-Text**: Deepgram Nova-3 (Real-time speech recognition)
- **Text-to-Speech**: Deepgram Aura-2 (Natural voice synthesis)
- **Audio Processing**: Web Audio API (Browser-based audio handling)
- **Sample Rate**: 24kHz (High-quality audio streaming)

### **Backend & Communication**
- **WebSocket Server**: ws (Real-time bidirectional communication)
- **HTTP Server**: Node.js built-in (Static file serving)
- **Code Generation**: Anthropic API (Dynamic application creation)
- **Local Preview**: Child process spawning (Development server management)

### **Development Tools**
- **Build System**: Next.js SWC (Fast TypeScript/JavaScript compiler)
- **Linting**: ESLint (Code quality and consistency)
- **CSS Processing**: PostCSS + Autoprefixer (CSS optimization)
- **Package Manager**: npm (Dependency management)

### **Critical OS Packages & Dependencies**

**System Requirements:**
- **Operating System**: macOS, Linux, or Windows 10+
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 500MB free space for project files

**Browser Requirements:**
- **Modern Browser**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Microphone Access**: Required for voice input
- **JavaScript**: Must be enabled
- **WebSocket Support**: Required for real-time communication

**Network Requirements:**
- **Internet Connection**: Required for AI API calls
- **Firewall**: Allow connections to OpenAI and Deepgram APIs
- **Ports**: 3000, 3001, and dynamic ports 4000+ for generated apps

## 🔄 Enhanced Workflow

### **Phase 1: Voice Ideation (Human ↔ AI Conversation)**
```
User speaks → Deepgram STT → Enhanced GPT-4 Processing → Deepgram TTS → User hears response
```
1. **Audio Capture**: Browser captures microphone input at 24kHz
2. **Speech Recognition**: Deepgram converts speech to text in real-time
3. **Enhanced AI Processing**: Problem-focused GPT-4 challenges assumptions and drives innovation
4. **Speech Synthesis**: Deepgram converts AI responses back to speech
5. **Accelerated Flow**: 3-4 focused exchanges with smart readiness detection

### **Phase 2: Specification Generation (AI → Silent YAML)**
```
Conversation Context → GPT-4 Analysis → Silent YAML Generation → Seamless Transition
```
1. **Context Analysis**: AI reviews entire conversation history
2. **Requirement Extraction**: Identifies key features, users, and technical needs
3. **Silent YAML Creation**: Generates structured specification document in background
4. **Seamless Transition**: Moves directly to code generation without user interruption

### **Phase 3: Code Generation (AI → Full Application)**
```
YAML Specification → Claude Sonnet Code Generation → File System Creation → Local Preview
```
1. **Specification Processing**: AI analyzes YAML requirements silently
2. **Architecture Planning**: Determines optimal file structure and components
3. **Code Generation**: Creates complete Next.js application with TypeScript
4. **Visual Progress**: Real-time progress bar with rotating status words
5. **File System Setup**: Writes all files to local directory structure
6. **Dependency Installation**: Automatically installs required npm packages
7. **Development Server**: Spawns local preview server for immediate testing

### **Phase 4: Preview & Iteration (Application → User)**
```
Generated App → Local Server → Browser Preview → User Feedback → Refinements
```
1. **Server Startup**: Launches Next.js development server
2. **Live Preview**: Opens generated application in browser
3. **Real-time Updates**: Hot reloading for any changes
4. **User Testing**: Full interaction with generated application
5. **Voice Refinements**: Natural language modifications and improvements

## 📊 Enhanced System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser UI    │    │  Voice Agent    │    │   AI Services   │
│ (React/Next.js) │◄──►│  (Node.js/WS)   │◄──►│ (OpenAI/Deepgram)│
│  Progress Bar   │    │  YAML Filter    │    │  Enhanced GPT-4  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Audio Stream   │    │  Code Generator │    │  Generated App  │
│ (WebAudio API)  │    │   (Claude API)  │    │  (Next.js App)  │
│ Status Updates  │    │ Progress Events │    │  Live Preview   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Features

- **🗣️ Voice-First Interface**: Speak naturally to describe your app idea
- **🧠 Enhanced AI**: Problem-focused AI that challenges assumptions and drives innovation
- **📊 Visual Progress**: Real-time progress bar with dynamic status updates
- **🤖 AI-Powered Generation**: Uses OpenAI GPT-4 and Claude for understanding and code generation
- **🎨 Beautiful Design**: Creates professionally designed applications, not plain templates
- **⚡ Real-Time Preview**: See your app come to life instantly with live preview
- **📱 Responsive Design**: Generated apps work perfectly on all devices
- **🔧 Full-Stack**: Generates complete Next.js applications with TypeScript
- **🔄 Seamless Flow**: Intelligent YAML processing without user interruption
- **📥 Code Download**: Download your generated applications as ZIP files

## 🚀 How It Works

VocalFlow follows an enhanced 4-phase workflow:

1. **💡 Ideation Phase**: Have a focused conversation with problem-solving AI (3-4 exchanges)
2. **📝 Silent Processing**: AI processes specifications in the background seamlessly
3. **⚡ Code Generation**: Watch real-time progress as AI generates your complete application
4. **🎙️ Voice Refinement**: Make natural language improvements and refinements

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, WebSocket (ws)
- **AI**: OpenAI GPT-4 (Enhanced), Anthropic Claude, Deepgram (Speech-to-Text & Text-to-Speech)
- **Voice Processing**: Real-time audio streaming with 24kHz sampling
- **Progress System**: Custom React components with WebSocket event streaming

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Anthropic API key
- Deepgram API key

## 🔧 Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd VoiceCreation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start:
   - Voice agent server on `http://localhost:3000`
   - Frontend interface on `http://localhost:3001`

5. **Enable Code Download Feature (Optional)**
   To enable downloading generated code as ZIP files:
   ```bash
   npm install archiver @types/archiver
   ```
   
   This adds the ability to download your generated applications as ZIP files for local development or deployment.

## 🎯 Usage

1. **Open your browser** and navigate to `http://localhost:3001`

2. **Click "Start Recording"** to begin voice interaction

3. **Describe your app idea** naturally:
   - "I want to create a tutoring marketplace for college students"
   - "Build me a fitness tracking app with social features"
   - "Create an e-commerce site for handmade crafts"

4. **Engage with the problem-solving AI** that will challenge your assumptions and ask provocative questions to refine your concept

5. **Signal readiness** by saying "Let's build this!" or "I'm ready to start building"

6. **Watch real-time progress** as the AI generates your complete application with visual progress indicators

## 📁 Project Structure

```
VoiceCreation/
├── agents/                 # AI agents for different phases
│   ├── ideation.ts        # Enhanced voice conversation agent with problem-solving AI
│   └── codeGen.ts         # Code generation orchestrator with progress tracking
├── pages/                 # Next.js frontend pages
│   ├── _app.tsx          # App wrapper with global styles
│   └── index.tsx         # Main interface with visual progress system
├── utils/                 # Utility functions
│   ├── claudeCodegen.ts  # Claude code generation (default)
│   ├── openaiCodegen.ts  # OpenAI code generation (alternative)
│   └── localPreview.ts   # Local development server
├── test/                  # Test files
│   └── testCodeGen.ts    # Code generation tests
├── generated/             # Generated project files (gitignored)
├── styles/               # Global styles
│   └── globals.css       # Tailwind CSS with progress bar styles
└── package.json          # Project dependencies
```

## 🧪 Testing

Run code generation tests:
```bash
npm run test:codegen
```

Run with custom YAML:
```bash
npm run test:codegen:custom
```

## 🎨 Generated App Features

Every generated application includes:

- **🏠 Beautiful Landing Page**: Professional hero section, features, testimonials
- **📱 Responsive Design**: Mobile-first approach with modern UI
- **🎯 Conversion Focused**: Clear CTAs and user journey
- **⚡ Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS
- **🔧 Ready to Deploy**: Complete with package.json and config files
- **🎭 Custom Design**: Tailored to your app's target audience and purpose

## 🔧 Available Scripts

- `npm run dev` - Start both agent and frontend in development mode
- `npm run agent` - Start only the voice agent server
- `npm run frontend` - Start only the frontend development server
- `npm run build` - Build the TypeScript project
- `npm run start` - Start the production server
- `npm run test:codegen` - Test code generation functionality

## 🌟 Example Generated Apps

The system can generate various types of applications:

- **📚 Educational Platforms**: Learning management systems, tutoring marketplaces
- **💼 Business Tools**: CRM systems, project management, analytics dashboards
- **🛒 E-commerce**: Online stores, marketplaces, booking systems
- **🎮 Entertainment**: Gaming platforms, social apps, content creators
- **🏥 Healthcare**: Appointment booking, health tracking, telemedicine
- **💰 Fintech**: Payment systems, expense trackers, investment platforms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

**Voice not working?**
- Check microphone permissions in your browser
- Ensure you're using HTTPS or localhost
- Verify Deepgram API key is set correctly

**AI not challenging assumptions?**
- Ensure OpenAI API key is valid and has GPT-4 access
- Check that the enhanced system prompts are loaded correctly
- Verify the ideation agent is using the problem-solving configuration

**Progress bar not updating?**
- Check WebSocket connection in browser developer tools
- Verify progress events are being sent from the backend
- Ensure the progress multiplier is configured correctly (10x)

**Code generation failing?**
- Verify Anthropic API key is valid and has sufficient credits
- Check console logs for detailed error messages
- Ensure all dependencies are installed
- Verify YAML processing is working in the background

**Preview not loading?**
- Check if port 4000+ is available for generated apps
- Look for build errors in the generation logs
- Verify the generated package.json has correct dependencies

## 🔮 Coming Soon

- **🎙️ Advanced Voice Editing**: Enhanced voice commands for detailed app modifications
- **🔄 Iterative Improvements**: Multi-round refinement through natural conversation
- **🌐 Direct Deployment**: One-click deployment to Vercel, Netlify, and other platforms
- **📊 Analytics Integration**: Real-time user interaction tracking and app performance metrics
- **🎨 Custom Design Systems**: Brand-specific design templates and component libraries
- **🔍 Smart Debugging**: Voice-activated debugging and error resolution
- **🌍 Multi-language Support**: International voice recognition and generation

---

## 🔄 Alternative Setup: Using OpenAI Codegen

By default, Voice Creation uses Anthropic Claude for code generation. However, you can also use OpenAI's GPT models for code generation. Here's how to set it up:

### **Prerequisites for OpenAI Setup**
- OpenAI API key with GPT-4 access
- All other requirements remain the same

### **Environment Variables**
Add your OpenAI API key to your `.env` file:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### **Code Generation Changes**
The system includes both OpenAI and Claude code generation utilities:

- **Default**: `utils/claudeCodegen.ts` (Anthropic Claude)
- **Alternative**: `utils/openaiCodegen.ts` (OpenAI GPT-4)

### **Switching to OpenAI**
To use OpenAI for code generation, modify the import in `agents/codeGen.ts`:

```typescript
// Change from:
import { runClaudeCodegen } from '../utils/claudeCodegen';

// To:
import { runOpenAICodegen } from '../utils/openaiCodegen';
```

Then update the function call:
```typescript
// Change from:
const result = await runClaudeCodegen(yamlPrompt, sessionId, events);

// To:
const result = await runOpenAICodegen(yamlPrompt, sessionId, events);
```

### **OpenAI-Specific Features**
- **Model**: Uses GPT-4 for code generation
- **Enhanced Prompting**: Optimized prompts for OpenAI's model behavior
- **Consistent Output**: Same JSON format and file structure as Claude
- **Error Handling**: Robust parsing for OpenAI's response format

### **Performance Comparison**
| Feature | Claude | OpenAI GPT-4 |
|---------|---------|--------------|
| Code Quality | Excellent | Excellent |
| Response Speed | Fast | Moderate |
| Context Handling | Superior | Good |
| Cost | Lower | Higher |
| Availability | High | High |

### **Testing OpenAI Codegen**
Test the OpenAI code generation specifically:
```bash
# Test with OpenAI (modify test file to use OpenAI)
npm run test:codegen
```

### **Troubleshooting OpenAI Setup**
**API Key Issues:**
- Ensure your OpenAI API key has GPT-4 access
- Check your OpenAI account has sufficient credits
- Verify the API key is correctly set in `.env`

**Model Limitations:**
- OpenAI has rate limits that may affect generation speed
- Large applications may hit token limits (use shorter descriptions)
- Monitor your OpenAI usage dashboard for costs

**Response Format:**
- OpenAI responses may require different JSON parsing
- Check console logs for parsing errors
- The system includes fallback parsing for both models

### **Best Practices for OpenAI**
1. **Keep descriptions concise** to avoid token limits
2. **Monitor API usage** to control costs
3. **Test with simple apps first** before complex projects
4. **Use specific, clear language** for better results

### **Switching Back to Claude**
To revert to Claude, simply change the imports back in `agents/codeGen.ts`:
```typescript
import { runClaudeCodegen } from '../utils/claudeCodegen';
```

Both systems generate the same high-quality applications with identical features and file structures. Choose based on your API preferences, cost considerations, and availability requirements.

---

**VocalFlow** - Built with ❤️ using AI and voice technology

*Transforming ideas into reality, one voice at a time.* 

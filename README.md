# Voice Creation 🎙️

**Empowering Everyone to Build with Voice**

In a world where technology should serve everyone, not just those who speak code, Voice Creation breaks down the barriers between imagination and creation. This isn't just another development tool—it's a bridge that allows anyone, regardless of technical background, to bring their digital dreams to life through the most natural interface we have: our voice.

Whether you're a small business owner with a game-changing idea, a teacher who wants to create educational tools, or simply someone who sees a problem that technology could solve, Voice Creation believes that your vision matters. You shouldn't need to learn programming languages, understand complex frameworks, or hire expensive developers to turn your ideas into reality. Just speak naturally about what you want to build, and watch as AI transforms your words into professional, fully-functional web applications.

This is technology as it should be: intuitive, accessible, and empowering. Your voice is your code, your ideas are your blueprint, and your imagination is the only limit.

---

A voice-first AI assistant that helps users design and build web applications through natural conversation. Simply describe your app idea by speaking, and watch as the AI generates a complete, professionally designed web application.

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
- **Code Generation**: OpenAI API (Dynamic application creation)
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

## 🔄 High-Level Workflow

### **Phase 1: Voice Ideation (Human ↔ AI Conversation)**
```
User speaks → Deepgram STT → GPT-4 Processing → Deepgram TTS → User hears response
```
1. **Audio Capture**: Browser captures microphone input at 24kHz
2. **Speech Recognition**: Deepgram converts speech to text in real-time
3. **AI Processing**: GPT-4 analyzes user input and generates responses
4. **Speech Synthesis**: Deepgram converts AI responses back to speech
5. **Conversation Flow**: Natural back-and-forth until app concept is clear

### **Phase 2: Specification Generation (AI → YAML)**
```
Conversation Context → GPT-4 Analysis → YAML Generation → User Approval
```
1. **Context Analysis**: AI reviews entire conversation history
2. **Requirement Extraction**: Identifies key features, users, and technical needs
3. **YAML Creation**: Generates structured specification document
4. **User Validation**: Reads specification aloud for user approval

### **Phase 3: Code Generation (AI → Full Application)**
```
YAML Specification → GPT-4 Code Generation → File System Creation → Local Preview
```
1. **Specification Processing**: AI analyzes approved YAML requirements
2. **Architecture Planning**: Determines optimal file structure and components
3. **Code Generation**: Creates complete Next.js application with TypeScript
4. **File System Setup**: Writes all files to local directory structure
5. **Dependency Installation**: Automatically installs required npm packages
6. **Development Server**: Spawns local preview server for immediate testing

### **Phase 4: Preview & Iteration (Application → User)**
```
Generated App → Local Server → Browser Preview → User Feedback → Refinements
```
1. **Server Startup**: Launches Next.js development server
2. **Live Preview**: Opens generated application in browser
3. **Real-time Updates**: Hot reloading for any changes
4. **User Testing**: Full interaction with generated application
5. **Feedback Loop**: Voice commands for modifications (coming soon)

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser UI    │    │  Voice Agent    │    │   AI Services   │
│  (React/Next)   │◄──►│  (Node.js/WS)   │◄──►│ (OpenAI/Deepgram)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Audio Stream   │    │  Code Generator │    │  Generated App  │
│ (WebAudio API)  │    │   (OpenAI API)  │    │  (Next.js App)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Features

- **🗣️ Voice-First Interface**: Speak naturally to describe your app idea
- **🤖 AI-Powered Generation**: Uses OpenAI GPT-4 to understand and generate code
- **🎨 Beautiful Design**: Creates professionally designed landing pages, not plain white screens
- **⚡ Real-Time Preview**: See your app come to life instantly with live preview
- **📱 Responsive Design**: Generated apps work perfectly on all devices
- **🔧 Full-Stack**: Generates complete Next.js applications with TypeScript
- **📥 Code Download**: Download your generated applications as ZIP files for local development

## 🚀 How It Works

Voice Creation follows a 4-phase workflow:

1. **💡 Ideation Phase**: Have a natural conversation about your app idea
2. **📝 Prompt Review**: Review and approve the generated YAML specification
3. **⚡ Code Generation**: AI generates a complete web application
4. **🎙️ Voice Editing**: Make changes through voice commands (coming soon)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, WebSocket (ws)
- **AI**: Anthropic Claude, Deepgram (Speech-to-Text & Text-to-Speech)
- **Voice Processing**: Real-time audio streaming with 16kHz sampling

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

4. **Review the generated specification** when the AI presents the YAML summary

5. **Approve the specification** by saying "That looks great!" or "Perfect!"

6. **Watch your app generate** in real-time with live preview

## 📁 Project Structure

```
VoiceCreation/
├── agents/                 # AI agents for different phases
│   ├── ideation.ts        # Main voice conversation agent
│   ├── codeGen.ts         # Code generation orchestrator
│   └── ideationBackup.ts  # Backup agent configuration
├── pages/                 # Next.js frontend pages
│   ├── _app.tsx          # App wrapper with global styles
│   └── index.tsx         # Main chat interface
├── utils/                 # Utility functions
│   ├── openaiCodegen.ts  # OpenAI code generation
│   └── localPreview.ts   # Local development server
├── test/                  # Test files
│   └── testCodeGen.ts    # Code generation tests
├── generated/             # Generated project files (gitignored)
├── styles/               # Global styles
│   └── globals.css       # Tailwind CSS styles
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

**Code generation failing?**
- Verify Anthropic API key is valid and has sufficient credits
- Check console logs for detailed error messages
- Ensure all dependencies are installed

**Preview not loading?**
- Check if port 4000+ is available for generated apps
- Look for build errors in the generation logs
- Verify the generated package.json has correct dependencies

## 🔮 Coming Soon

- **🎙️ Voice Editing**: Make changes to generated apps through voice commands
- **🔄 Iterative Improvements**: Refine apps through conversation
- **🌐 Direct Deployment**: Deploy generated apps to hosting platforms
- **📊 Analytics Integration**: Track user interactions and app performance
- **🎨 Custom Design Systems**: Brand-specific design templates

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

Built with ❤️ using AI and voice technology 

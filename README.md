# Voice Creation 🎙️

A voice-first AI assistant that helps users design and build web applications through natural conversation. Simply describe your app idea by speaking, and watch as the AI generates a complete, professionally designed web application.

## ✨ Features

- **🗣️ Voice-First Interface**: Speak naturally to describe your app idea
- **🤖 AI-Powered Generation**: Uses OpenAI GPT-4 to understand and generate code
- **🎨 Beautiful Design**: Creates professionally designed landing pages, not plain white screens
- **⚡ Real-Time Preview**: See your app come to life instantly with live preview
- **📱 Responsive Design**: Generated apps work perfectly on all devices
- **🔧 Full-Stack**: Generates complete Next.js applications with TypeScript

## 🚀 How It Works

Voice Creation follows a 4-phase workflow:

1. **💡 Ideation Phase**: Have a natural conversation about your app idea
2. **📝 Prompt Review**: Review and approve the generated YAML specification
3. **⚡ Code Generation**: AI generates a complete web application
4. **🎙️ Voice Editing**: Make changes through voice commands (coming soon)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, WebSocket (ws)
- **AI**: OpenAI GPT-4, Deepgram (Speech-to-Text & Text-to-Speech)
- **Voice Processing**: Real-time audio streaming with 16kHz sampling

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
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
   OPENAI_API_KEY=your_openai_api_key_here
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start:
   - Voice agent server on `http://localhost:3000`
   - Frontend interface on `http://localhost:3001`

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
- Verify OpenAI API key is valid and has sufficient credits
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

Built with ❤️ using AI and voice technology 
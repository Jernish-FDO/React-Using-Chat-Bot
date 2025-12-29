# React AI Assistant

An advanced AI Assistant web application built with React, TypeScript, and Vite. Features real-time web browsing via Tavily API, Gemini AI integration, markdown rendering with syntax highlighting, and a modern dark-themed UI.

![AI Assistant](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-blue)
![React](https://img.shields.io/badge/React-18.3-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-06B6D4)

## ✨ Features

- 🤖 **Gemini AI Integration** - Powered by Gemini 2.0 Flash with function calling
- 🔍 **Web Search** - Real-time web search using Tavily API
- 📝 **Rich Markdown** - Full markdown support with syntax highlighting and LaTeX
- 🛠️ **Tool System** - Granular on/off toggles for AI tools
- 💾 **Persistent Storage** - Conversations saved locally with Zustand
- 🌙 **Dark Theme** - Beautiful dark UI with custom color palette
- ⚡ **Fast & Responsive** - Built with Vite for lightning-fast development

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/react-ai-assistant.git
cd react-ai-assistant

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Configure API Keys

Edit `.env.local` with your API keys:

```env
# Gemini API Key (Required)
# Get yours at: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Tavily API Key (Required for web search)
# Get yours at: https://tavily.com (1000 free calls/month)
VITE_TAVILY_API_KEY=your_tavily_api_key_here
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## 🏗️ Project Structure

```
src/
├── components/
│   ├── chat/           # Chat UI components
│   ├── layout/         # Header, Sidebar, MainLayout
│   ├── tools/          # Tool toggle panel
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/
│   ├── gemini/         # Gemini API client & prompts
│   └── tavily/         # Tavily search client
├── stores/             # Zustand state stores
├── types/              # TypeScript interfaces
└── utils/              # Utility functions
```

## 🔧 Available Tools

| Tool | Description | API Required |
|------|-------------|--------------|
| Web Search | Search the internet for real-time information | Tavily |
| Calculator | Perform mathematical calculations | None |
| Current Time | Get current date/time in any timezone | None |

## 📦 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **AI**: Google Generative AI SDK
- **Markdown**: react-markdown + remark/rehype plugins
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 🔒 Security Notes

> ⚠️ **Important**: API keys are exposed in client-side code. This is acceptable for personal projects but not recommended for production applications with sensitive data.

**Mitigations implemented:**
- HTTP referrer restrictions (configure in Google Cloud Console)
- Client-side rate limiting
- Usage tracking with warnings

## 📄 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

---

Built with ❤️ using React + Vite + Gemini AI

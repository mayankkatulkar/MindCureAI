# Agent Starter for React

A comprehensive LiveKit agent application that provides voice interaction, file upload capabilities, call tracing, and RAG (Retrieval-Augmented Generation) features. Built with Next.js and the LiveKit JavaScript SDK.

Also available for:
[Android](https://github.com/livekit-examples/agent-starter-android) • [Flutter](https://github.com/livekit-examples/agent-starter-flutter) • [Swift](https://github.com/livekit-examples/agent-starter-swift) • [React Native](https://github.com/livekit-examples/agent-starter-react-native)

## Features

### Core Voice & Chat Features
- **Real-time voice interaction** with LiveKit Agents
- **Audio visualization** and level monitoring
- **Chat input** support for text-based interactions
- **Streaming text panel** for real-time transcription display
- **Device selection** for audio input/output

### File Management & Knowledge Base
- **File upload** functionality with drag-and-drop support
- **Multiple file format** support (PDF, DOCX, TXT, etc.)
- **Knowledge base updates** for RAG capabilities
- **Upload statistics** and progress tracking
- **File management** with clear/update operations

### Call Tracing & Analytics
- **Call trace recording** and storage
- **Detailed call analytics** with statistics
- **Call trace filtering** and search capabilities
- **Call trace cards** with comprehensive metadata
- **Performance metrics** and timing analysis

### User Interface
- **Light/dark theme** switching with system preference detection
- **Responsive design** with modern UI components
- **Customizable branding** and colors via configuration
- **Header tabs** for navigation between features
- **Alert system** with toast notifications
- **Loading states** and error handling

### Developer Experience
- **TypeScript** support throughout
- **ESLint** and **Prettier** configuration
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **Motion** animations for smooth interactions

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- LiveKit Cloud account or self-hosted LiveKit server
- Python backend for RAG functionality (see backend README)

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd frontend
   pnpm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with your LiveKit credentials:
   ```env
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   LIVEKIT_URL=https://your-livekit-server-url
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to http://localhost:3000

### LiveKit Cloud Deployment

For the easiest setup, deploy directly to LiveKit Cloud:

[![Open on LiveKit](https://img.shields.io/badge/Open%20on%20LiveKit%20Cloud-002CF2?style=for-the-badge&logo=external-link)](https://cloud.livekit.io/projects/p_/sandbox/templates/voice-assistant-frontend)


```

## Configuration

### App Configuration (`app-config.ts`)

Customize the application appearance and features:

```typescript
export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'LiveKit',
  pageTitle: 'LiveKit Voice Agent',
  pageDescription: 'A voice agent built with LiveKit',
  
  // Feature toggles
  supportsChatInput: true,
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,
  
  // Branding
  logo: '/lk-logo.svg',
  accent: '#002CF2',
  logoDark: '/lk-logo-dark.svg',
  accentDark: '#1FD5F9',
  startButtonText: 'Start call',
};
```

### Environment Variables

Required environment variables:

```env
# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=https://your-livekit-server-url

# Optional: Backend API URL (for RAG features)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Features in Detail

### Voice Agent
- Real-time voice interaction with LiveKit Agents
- Audio level monitoring and visualization
- Device selection for audio input/output
- Chat input for text-based interactions

### File Upload & RAG
- Drag-and-drop file upload interface
- Support for multiple file formats
- Knowledge base updates for RAG functionality
- Upload progress tracking and statistics

### Call Tracing
- Comprehensive call trace recording
- Detailed analytics and performance metrics
- Filtering and search capabilities
- Export and management features

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
pnpm format:check # Check code formatting
```

### Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **LiveKit:** LiveKit Client SDK
- **Animations:** Motion (Framer Motion)
- **Package Manager:** pnpm




## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

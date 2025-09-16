<a href="https://livekit.io/">
  <img src="./.github/assets/livekit-mark.png" alt="LiveKit logo" width="100" height="100">
</a>

# LiveKit Agents Starter - Python

A complete starter project for building voice AI apps with [LiveKit Agents for Python](https://github.com/livekit/agents).

The starter project includes:

- A simple voice AI assistant based on the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai/)
- Voice AI pipeline based on [OpenAI](https://docs.livekit.io/agents/integrations/llm/openai/), [Cartesia](https://docs.livekit.io/agents/integrations/tts/cartesia/), and [Deepgram](https://docs.livekit.io/agents/integrations/llm/deepgram/)
  - Easily integrate your preferred [LLM](https://docs.livekit.io/agents/integrations/llm/), [STT](https://docs.livekit.io/agents/integrations/stt/), and [TTS](https://docs.livekit.io/agents/integrations/tts/) instead, or swap to a realtime model like the [OpenAI Realtime API](https://docs.livekit.io/agents/integrations/realtime/openai)
- Eval suite based on the LiveKit Agents [testing & evaluation framework](https://docs.livekit.io/agents/build/testing/)
- [LiveKit Turn Detector](https://docs.livekit.io/agents/build/turns/turn-detector/) for contextually-aware speaker detection, with multilingual support
- [LiveKit Cloud enhanced noise cancellation](https://docs.livekit.io/home/cloud/noise-cancellation/)
- Integrated [metrics and logging](https://docs.livekit.io/agents/build/metrics/)

This starter app is compatible with any [custom web/mobile frontend](https://docs.livekit.io/agents/start/frontend/) or [SIP-based telephony](https://docs.livekit.io/agents/start/telephony/).

## Dev Setup

Clone the repository and install dependencies to a virtual environment:

```console
cd agent-starter-python
uv sync
```

Set up the environment by copying `.env.example` to `.env.local` and filling in the required values:

- `LIVEKIT_URL`: Use [LiveKit Cloud](https://cloud.livekit.io/) or [run your own](https://docs.livekit.io/home/self-hosting/)
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `OPENAI_API_KEY`: [Get a key](https://platform.openai.com/api-keys) or use your [preferred LLM provider](https://docs.livekit.io/agents/integrations/llm/)
- `DEEPGRAM_API_KEY`: [Get a key](https://console.deepgram.com/) or use your [preferred STT provider](https://docs.livekit.io/agents/integrations/stt/)
- `CARTESIA_API_KEY`: [Get a key](https://play.cartesia.ai/keys) or use your [preferred TTS provider](https://docs.livekit.io/agents/integrations/tts/)

You can load the LiveKit environment automatically using the [LiveKit CLI](https://docs.livekit.io/home/cli/cli-setup):

```bash
lk app env -w .env.local
```

## Run the agent

Before your first run, you must download certain models such as [Silero VAD](https://docs.livekit.io/agents/build/turns/vad/) and the [LiveKit turn detector](https://docs.livekit.io/agents/build/turns/turn-detector/):

```console
uv run python src/agent.py download-files
```

Next, run this command to speak to your agent directly in your terminal:

```console
uv run python src/agent.py console
```

To run the agent for use with a frontend or telephony, use the `dev` command:

```console
uv run python src/agent.py dev
```

In production, use the `start` command:

```console
uv run python src/agent.py start
```

## Frontend & Telephony

Get started quickly with our pre-built frontend starter apps, or add telephony support:

| Platform | Link | Description |
|----------|----------|-------------|
| **Web** | [`livekit-examples/agent-starter-react`](https://github.com/livekit-examples/agent-starter-react) | Web voice AI assistant with React & Next.js |
| **iOS/macOS** | [`livekit-examples/agent-starter-swift`](https://github.com/livekit-examples/agent-starter-swift) | Native iOS, macOS, and visionOS voice AI assistant |
| **Flutter** | [`livekit-examples/agent-starter-flutter`](https://github.com/livekit-examples/agent-starter-flutter) | Cross-platform voice AI assistant app |
| **React Native** | [`livekit-examples/voice-assistant-react-native`](https://github.com/livekit-examples/voice-assistant-react-native) | Native mobile app with React Native & Expo |
| **Android** | [`livekit-examples/agent-starter-android`](https://github.com/livekit-examples/agent-starter-android) | Native Android app with Kotlin & Jetpack Compose |
| **Web Embed** | [`livekit-examples/agent-starter-embed`](https://github.com/livekit-examples/agent-starter-embed) | Voice AI widget for any website |
| **Telephony** | [📚 Documentation](https://docs.livekit.io/agents/start/telephony/) | Add inbound or outbound calling to your agent |

For advanced customization, see the [complete frontend guide](https://docs.livekit.io/agents/start/frontend/).

## Tests and evals

This project includes a complete suite of evals, based on the LiveKit Agents [testing & evaluation framework](https://docs.livekit.io/agents/build/testing/). To run them, use `pytest`.

```console
uv run pytest
```

## Using this template repo for your own project

Once you've started your own project based on this repo, you should:

1. **Check in your `uv.lock`**: This file is currently untracked for the template, but you should commit it to your repository for reproducible builds and proper configuration management. (The same applies to `livekit.toml`, if you run your agents in LiveKit Cloud)

2. **Remove the git tracking test**: Delete the "Check files not tracked in git" step from `.github/workflows/tests.yml` since you'll now want this file to be tracked. These are just there for development purposes in the template repo itself.

3. **Add your own repository secrets**: You must [add secrets](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/using-secrets-in-github-actions) for `OPENAI_API_KEY` or your other LLM provider so that the tests can run in CI.

## Deploying to production

This project is production-ready and includes a working `Dockerfile`. To deploy it to LiveKit Cloud or another environment, see the [deploying to production](https://docs.livekit.io/agents/ops/deployment/) guide.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# Backend Documentation

## File Upload System

The application now includes a file upload system that allows users to upload documents to the `src/data` folder. This enables the RAG (Retrieval-Augmented Generation) system to work with user-provided documents.

### Supported File Types
- PDF files (.pdf)
- Microsoft Word documents (.doc, .docx)
- Text files (.txt)
- CSV files (.csv)
- Excel files (.xls, .xlsx)

### File Size Limits
- Maximum file size: 50MB per file

### API Endpoints

#### POST /api/upload
Uploads a file to the `src/data` folder.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with a `file` field containing the file to upload

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "fileName": "document_1234567890.pdf",
  "originalName": "document.pdf",
  "size": 1024000,
  "type": "application/pdf"
}
```

#### GET /api/upload
Retrieves a list of all uploaded files and statistics.

**Response:**
```json
{
  "files": [
    {
      "name": "document_1234567890.pdf",
      "size": 1024000,
      "modified": "2024-01-01T12:00:00.000Z",
      "isDirectory": false
    }
  ],
  "totalFiles": 1,
  "totalSize": 1024000
}
```

#### DELETE /api/upload
Deletes all files from the `src/data` folder.

**Response:**
```json
{
  "success": true,
  "message": "All files deleted successfully"
}
```

### Frontend Integration

The file upload system is integrated into the frontend with the following components:

1. **Upload Component** (`frontend/components/upload/Upload.tsx`)
   - Drag and drop file upload interface
   - File type validation
   - Upload progress indication
   - Real-time file list display

2. **Stats Component** (`frontend/components/upload/Stats.tsx`)
   - Displays total number of files
   - Shows total file size
   - Shows latest upload date

3. **Clear Component** (`frontend/components/upload/Clear.tsx`)
   - Allows users to delete all uploaded files
   - Confirmation dialog before deletion

### File Storage

Uploaded files are stored in the `src/data` folder with the following naming convention:
- Original filename with timestamp suffix to prevent conflicts
- Example: `document.pdf` becomes `document_1234567890.pdf`

### Security Considerations

- File type validation prevents malicious file uploads
- File size limits prevent abuse
- Files are stored in a controlled directory structure
- No direct file execution is allowed

### Integration with RAG System

The uploaded files in the `src/data` folder can be used by the existing RAG (Retrieval-Augmented Generation) system:

- Files are automatically available for document processing
- The existing `llamaindex_rag.py` and `livekit_rag.py` modules can access these files
- The agent can reference and query the uploaded documents during conversations
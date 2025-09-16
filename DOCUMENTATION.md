
## 🐳 Docker Deployment

This section covers how to build and run the application using Docker containers for both development and production environments.

### 🏗️ Building Docker Images

#### Backend (Python Agent)

The backend uses a multi-stage Docker build optimized for Python applications:

```bash
# Build the backend image
docker build -t voice-agent .
```

**Key Features:**
- Uses UV Python package manager for faster dependency resolution
- Non-privileged user (`appuser`) for security
- Pre-downloads ML models during build
- Optimized for production with health checks

**Build Configuration:**
- Base image: `ghcr.io/astral-sh/uv:python3.11-bookworm-slim`
- Exposed port: `8081` (health check)
- Working directory: `/home/appuser`
- Dependencies installed via `uv sync --locked`

#### Frontend (Next.js)

The frontend uses a Node.js-based build optimized for Next.js applications:

```bash
# Build the frontend image
cd frontend
docker build -t voice-frontend .
```

**Key Features:**
- Uses Node.js 18 Alpine for smaller image size
- PNPM for faster package management
- Production build with optimized assets
- Exposed port: `3000`

### 🚀 Running with Docker Compose

#### Complete Application Stack

Use the root `docker-compose.yml` to run the backend agent:

```bash
# Start the backend agent
docker-compose up --build
```

#### Frontend Only

Use the frontend-specific `docker-compose.yml`:

```bash
# Start the frontend
cd frontend
docker-compose up --build
```

#### Environment Configuration

Create `.env.local` files for both services:

**Backend (.env.local):**
```bash
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
CARTESIA_API_KEY=your_cartesia_key
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url
NEXT_PUBLIC_API_URL=http://localhost:8081
```

### 🔧 Docker Development Workflow

#### Development Mode

For development with hot reloading:

```bash
# Backend development
docker run -it --rm \
  -p 8081:8081 \
  -v $(pwd)/src:/home/appuser/src \
  -e PYTHONPATH=/home/appuser \
  voice-agent uv run python src/agent.py dev

# Frontend development
cd frontend
docker run -it --rm \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  voice-frontend pnpm dev
```

### 📊 Container Health Monitoring

#### Backend Health Check

The backend container includes a health check endpoint:

```bash
# Check backend health
curl http://localhost:8081/health

# View container health status
docker ps
```

#### Frontend Health Check

The frontend serves on port 3000:

```bash
# Check frontend availability
curl http://localhost:3000

# View container status
docker ps
```

### 🛠️ Docker Troubleshooting

#### Common Issues

**Port Conflicts:**
```bash
# Check what's using the ports
lsof -i :8081
lsof -i :3000

# Use different ports
docker run -p 8082:8081 voice-agent
```



### 🔒 Security Best Practices

#### Container Security

- **Non-privileged user**: Backend runs as `appuser` instead of root
- **Minimal base images**: Uses slim variants to reduce attack surface
- **Dependency locking**: Uses `uv.lock` for reproducible builds
- **Health checks**: Monitors container health automatically
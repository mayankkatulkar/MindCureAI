#!/bin/bash
# MindCureAI EC2 Deployment Script
# Run this on your EC2 instance after SSH'ing in

set -e  # Exit on error

echo "🚀 MindCureAI EC2 Deployment Script"
echo "===================================="

# Update system
echo "📦 Updating system packages..."
sudo yum update -y || sudo apt-get update -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    # For Amazon Linux 2023 / AL2
    sudo yum install -y docker 2>/dev/null || {
        # For Ubuntu
        sudo apt-get install -y docker.io
    }
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "⚠️  Please log out and back in for Docker permissions to take effect, then run this script again"
    exit 0
fi

# Install Docker Compose
echo "📦 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Git
echo "📦 Installing Git..."
sudo yum install -y git 2>/dev/null || sudo apt-get install -y git

# Clone or update repository
echo "📥 Getting MindCureAI code..."
if [ -d "MindCureAI" ]; then
    cd MindCureAI
    git pull origin main
else
    git clone https://github.com/YOUR_USERNAME/MindCureAI.git
    cd MindCureAI
fi

# Check for .env files
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  IMPORTANT: You need to create environment files!"
    echo ""
    echo "Create .env with:"
    echo "  nano .env"
    echo ""
    echo "Add these variables (replace with your actual values):"
    cat << 'EOF'
# Backend Environment Variables
LIVEKIT_URL=wss://your-livekit.livekit.cloud
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
GOOGLE_API_KEY=your_gemini_key
GOOGLE_GENAI_API_KEY=your_gemini_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
EOF
    echo ""
    exit 1
fi

if [ ! -f "frontend/.env.local" ]; then
    echo ""
    echo "⚠️  Create frontend/.env.local with your frontend env vars"
    echo "  nano frontend/.env.local"
    exit 1
fi

# Build and run with Docker Compose
echo "🏗️  Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app should be running at:"
echo "   Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "   Agent:    http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8081"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "   Restart:       docker-compose -f docker-compose.prod.yml restart"
echo "   Stop:          docker-compose -f docker-compose.prod.yml down"
echo "   Update:        git pull && docker-compose -f docker-compose.prod.yml up -d --build"

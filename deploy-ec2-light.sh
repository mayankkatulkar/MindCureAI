#!/bin/bash
# MindCureAI Lightweight EC2 Deployment (No Docker)
# Perfect for t2.micro with 1GB RAM

set -e

echo "🚀 MindCureAI Lightweight Deployment"
echo "====================================="

# Update system
echo "📦 Updating system..."
sudo yum update -y

# Install Node.js 20 (LTS)
echo "📦 Installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
sudo npm install -g pnpm pm2

# Install Python for backend
echo "🐍 Installing Python..."
sudo yum install -y python3.11 python3.11-pip git

# Create swap (2GB) to prevent OOM
echo "💾 Creating 2GB swap space..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
fi
echo "Swap enabled:"
free -m

# Clone or update repository
echo "📥 Getting MindCureAI code..."
cd ~
if [ -d "MindCureAI" ]; then
    cd MindCureAI
    git pull origin main
else
    git clone https://github.com/mayankkatulkar/MindCureAI.git
    cd MindCureAI
fi

# Check for env files
if [ ! -f "frontend/.env.local" ]; then
    echo ""
    echo "⚠️  Create frontend/.env.local with your environment variables"
    echo "   nano frontend/.env.local"
    echo ""
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
pnpm install

# Build frontend (this is the memory-intensive step)
echo "🏗️  Building frontend (this takes 5-10 minutes on t2.micro)..."
NODE_OPTIONS="--max-old-space-size=512" pnpm build

# Start with PM2 (process manager for auto-restart)
echo "🚀 Starting frontend with PM2..."
pm2 delete mindcureai-frontend 2>/dev/null || true
pm2 start npm --name "mindcureai-frontend" -- start

# Set PM2 to start on boot
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is running at: http://$PUBLIC_IP:3000"
echo ""
echo "📋 Useful PM2 commands:"
echo "   pm2 logs mindcureai-frontend    # View logs"
echo "   pm2 restart mindcureai-frontend # Restart app"
echo "   pm2 status                      # Check status"
echo ""
echo "🔄 To update after code changes:"
echo "   cd ~/MindCureAI && git pull && cd frontend && pnpm build && pm2 restart mindcureai-frontend"

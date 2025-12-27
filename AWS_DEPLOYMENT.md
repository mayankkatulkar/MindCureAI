# MindCureAI AWS Free Tier Deployment Guide

**Cost: $0/month** (within free tier limits)

## Quick Overview

```
Your Mac → GitHub → EC2 (t2.micro free) → Your Domain (GoDaddy)
```

---

## What I've Done ✅

- Created `docker-compose.prod.yml` (frontend + agent)
- Created `frontend/Dockerfile.prod` (optimized build)
- Created `deploy-ec2.sh` (auto-installs everything on EC2)
- Created `.github/workflows/deploy.yml` (optional CI/CD)

---

## What YOU Need To Do 📋

### Step 1: Push Code to GitHub (5 min)

```bash
cd "/Users/mayankkatulkar/Desktop/mindcure ai/MindCureAI"
git add .
git commit -m "Add AWS deployment config"
git push origin main
```

### Step 2: Launch EC2 Instance (10 min)

1. Go to [AWS Console](https://console.aws.amazon.com/ec2)
2. Click **Launch Instance**
3. Configure:
   - **Name**: `mindcureai-server`
   - **AMI**: Amazon Linux 2023 (Free tier eligible)
   - **Instance type**: `t2.micro` (Free tier!)
   - **Key pair**: Create new → Download `.pem` file
   - **Security Group**: Create new with these rules:

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | My IP |
| HTTP | 80 | Anywhere |
| HTTPS | 443 | Anywhere |
| Custom TCP | 3000 | Anywhere |
| Custom TCP | 8081 | Anywhere |

4. Click **Launch Instance**
5. Wait for "Running" status

### Step 3: Connect to EC2 (2 min)

```bash
# Make key file secure
chmod 400 ~/Downloads/your-key.pem

# Connect (replace with your EC2 public IP)
ssh -i ~/Downloads/your-key.pem ec2-user@YOUR_EC2_IP
```

### Step 4: Deploy on EC2 (5 min)

```bash
# Download and run deploy script
curl -O https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/MindCureAI/main/deploy-ec2.sh
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

Then create the `.env` files when prompted.

### Step 5: Point GoDaddy Domain (5 min)

1. Go to [GoDaddy DNS Management](https://dcc.godaddy.com/manage)
2. Find your domain → **DNS**
3. Add/Edit these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_EC2_IP | 1 Hour |
| A | www | YOUR_EC2_IP | 1 Hour |

4. Wait 5-30 minutes for DNS propagation

### Step 6: Set Up Free SSL (5 min)

SSH into EC2 and run:

```bash
# Install Nginx and Certbot
sudo yum install -y nginx python3-certbot-nginx

# Get free SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Updating Your App 🔄

After making changes locally:

```bash
# On your Mac
git add . && git commit -m "Update" && git push

# On EC2 (SSH in first)
cd MindCureAI
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

**Can't connect to EC2?**
→ Check Security Group has your IP for SSH

**App not loading?**
→ Check logs: `docker-compose -f docker-compose.prod.yml logs`

**Out of disk space?**
→ Clean Docker: `docker system prune -a`

---

## Free Tier Limits

| Service | Free Tier Limit |
|---------|-----------------|
| EC2 t2.micro | 750 hours/month |
| EBS Storage | 30 GB |
| Data Transfer | 15 GB/month |

You're safe as long as you run ONE t2.micro instance!

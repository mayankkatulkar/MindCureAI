# Use a Node image with pnpm preinstalled
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy lockfile and manifest
COPY pnpm-lock.yaml ./
COPY package.json ./

# Install dependencies
RUN pnpm install

# Copy rest of the app
COPY . .

# Build the production version
RUN pnpm build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]

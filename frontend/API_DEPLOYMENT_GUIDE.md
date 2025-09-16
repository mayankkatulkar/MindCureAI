# API Deployment Guide for AWS ECS

## Overview

This guide explains the correct implementation for making API calls to your AWS ECS backend from the Next.js frontend.

## Environment Variables

Set up the following environment variables:

### For Development (.env.local)
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### For Production (.env.production)
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-aws-ecs-domain.com
```

## Correct Implementation

### 1. Backend URL Utility

The `getBackendUrl()` function in `lib/utils.ts` automatically handles the backend URL:

```typescript
export const getBackendUrl = (): string => {
  // Use NEXT_PUBLIC_BACKEND_URL if available (for production)
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:8000';
};
```

### 2. API Client

Use the `ApiClient` class in `lib/api.ts` for all backend communication:

```typescript
import { apiClient } from '@/lib/api';

// POST request
const response = await apiClient.post('your-endpoint', data);

// GET request
const response = await apiClient.get('your-endpoint');

// File upload
const response = await apiClient.uploadFile('upload', file);
```

### 3. Example Usage

```typescript
// ❌ WRONG - This only works locally
const response = await fetch('/api/your-endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
  headers: { 'Content-Type': 'application/json' },
});

// ✅ CORRECT - This works with AWS ECS
const response = await apiClient.post('your-endpoint', data);
```

## Migration Steps

### 1. Update Existing Components

Replace direct fetch calls with the API client:

```typescript
// Before
const response = await fetch('/api/add-call-trace', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(callTrace),
});

// After
const response = await apiClient.post('add-call-trace', callTrace);
```

### 2. Update API Routes

For routes that need to communicate with the backend, use the proxy route:

```typescript
// In your API route
import { getBackendUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/api/your-endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  return NextResponse.json(await response.json());
}
```

## AWS ECS Configuration

### 1. CORS Settings

Ensure your AWS ECS backend allows CORS from your frontend domain:

```python
# In your FastAPI app
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Environment Variables

Set the environment variable in your ECS task definition:

```json
{
  "environment": [
    {
      "name": "NEXT_PUBLIC_BACKEND_URL",
      "value": "https://your-aws-ecs-domain.com"
    }
  ]
}
```

## Testing

### 1. Local Development
```bash
# Start your local backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Start your frontend
npm run dev
```

### 2. Production Testing
```bash
# Build and deploy your frontend
npm run build
npm start
```

## Common Issues

### 1. CORS Errors
- Ensure your AWS ECS backend allows CORS from your frontend domain
- Check that the `NEXT_PUBLIC_BACKEND_URL` is correctly set

### 2. Network Errors
- Verify your AWS ECS service is accessible
- Check security groups and load balancer configuration
- Ensure the backend URL includes the correct protocol (https://)

### 3. Environment Variable Issues
- Remember that `NEXT_PUBLIC_` variables are exposed to the browser
- Use server-side environment variables for sensitive data
- Rebuild your application after changing environment variables

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **CORS Configuration**: Properly configure CORS on your backend
3. **API Keys**: Store sensitive API keys server-side, not in `NEXT_PUBLIC_` variables
4. **Input Validation**: Validate all inputs on both frontend and backend

## Monitoring

Monitor your API calls for:
- Response times
- Error rates
- CORS issues
- Network connectivity

Use browser developer tools and AWS CloudWatch for monitoring. 
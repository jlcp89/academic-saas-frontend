# Academic SaaS Frontend

A modern, responsive frontend for the Academic SaaS Platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Modern Stack**: Next.js 15+ with App Router, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with JWT integration
- **State Management**: React Query for server state, Zustand for client state
- **UI Components**: Shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Technology Stack

- **Framework**: Next.js 15.4.1 with App Router
- **Language**: TypeScript with strict typing
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth.js
- **State Management**: TanStack Query (React Query) + Zustand
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/login/         # Authentication pages
│   ├── dashboard/          # Main dashboard
│   ├── api/auth/           # NextAuth.js API routes
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Landing page
├── components/             # Reusable UI components
│   └── ui/                 # Shadcn/ui components
├── lib/                    # Utilities and configuration
│   ├── api-client.ts       # Authenticated API client
│   ├── constants.ts        # API endpoints and constants
│   ├── providers.tsx       # React Query + NextAuth providers
│   ├── queries.ts          # React Query hooks
│   ├── store.ts            # Zustand global state
│   └── utils.ts            # General utilities
└── types/                  # TypeScript type definitions
    ├── index.ts            # Main types matching Django models
    └── next-auth.d.ts      # NextAuth type extensions
```

## Local Development

### Quick Start (Full Stack)

If you have both backend and frontend repositories, use the automated script:

```bash
# From the parent directory containing both repos
./run_local.sh
```

This script will:
- Set up both backend and frontend environments
- Install all dependencies
- Configure environment variables
- Start both servers in parallel

**Access URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin/
- API Docs: http://localhost:8000/api/docs/

**Default Credentials:** `admin / admin123`

### Manual Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create `.env.local` file:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=dev-secret-key-change-in-production
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Authentication Flow

1. **Login Process**:
   - User submits credentials via React Hook Form
   - NextAuth.js calls Django `/api/auth/login/` for JWT tokens
   - Gets user data from `/api/users/me/` using access token
   - Stores session with NextAuth.js (secure HTTP-only cookies)

2. **API Requests**:
   - Use `useApiClient()` hook for authenticated requests
   - Automatically includes Bearer token in Authorization header
   - React Query handles caching, background updates, and error states

3. **State Management**:
   - **Server State**: Managed by React Query (user data, schools, subjects, etc.)
   - **UI State**: Managed by Zustand (sidebar open/closed, theme, etc.)
   - **Authentication State**: Managed by NextAuth.js session

## API Integration

All Django API endpoints are integrated with typed React Query hooks:

```typescript
// Example usage
import { useCurrentUser, useSchools, useSubjects } from '@/lib/queries';

function Dashboard() {
  const { data: user } = useCurrentUser();
  const { data: schools } = useSchools();
  const { data: subjects } = useSubjects();
  
  // Component logic
}
```

## Component Development

- Use Shadcn/ui components for consistent UI
- Extend with custom components in `src/components/`
- Follow Next.js App Router conventions
- Use TypeScript for type safety
- Implement responsive design with Tailwind CSS

## Form Handling

```typescript
// Example form with validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
  
  // Form logic
}
```

## Deployment

### Development Environment (Active)

The development environment is currently deployed and accessible at:

- **Frontend**: http://107.21.145.151:3000
- **Backend API**: http://107.21.145.151:8000
- **Django Admin**: http://107.21.145.151:8000/admin/
- **API Docs**: http://107.21.145.151:8000/api/docs/

**Credentials:** `admin / admin123`

### Deployment Process

#### Automatic Deployment (GitHub Actions)

1. **Push to main branch** triggers automatic deployment
2. **GitHub Actions** builds and pushes Docker images to ECR
3. **EC2 instances** automatically pull and deploy the new images

#### Manual Deployment

```bash
# Deploy frontend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 860639121390.dkr.ecr.us-east-1.amazonaws.com

# Access EC2 instance
ssh -i ~/.ssh/academic_saas_aws ec2-user@107.21.145.151

# Deploy latest frontend image
docker pull 860639121390.dkr.ecr.us-east-1.amazonaws.com/academic-saas-frontend:latest
docker stop academic-saas-frontend || true
docker rm academic-saas-frontend || true
docker run -d --name academic-saas-frontend --restart unless-stopped --network host -e NEXT_PUBLIC_API_URL=http://107.21.145.151:8000 -e NEXTAUTH_URL=http://107.21.145.151:3000 -e NEXTAUTH_SECRET=dev-secret-key-change-in-production 860639121390.dkr.ecr.us-east-1.amazonaws.com/academic-saas-frontend:latest
```

### Infrastructure

**Current Setup:**
- **AWS EC2**: t2.micro instance (107.21.145.151)
- **Docker Containers**: PostgreSQL, Redis, Django, Next.js
- **ECR**: Container registry for images
- **GitHub Actions**: CI/CD pipeline

**Monitoring:**
```bash
# Check container status
docker ps

# View logs
docker logs academic-saas-frontend

# Restart container
docker restart academic-saas-frontend
```

### Environment Variables (Production)

```bash
NEXT_PUBLIC_API_URL=http://107.21.145.151:8000
NEXTAUTH_URL=http://107.21.145.151:3000
NEXTAUTH_SECRET=dev-secret-key-change-in-production
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Check `NEXT_PUBLIC_API_URL` points to correct backend
   - Verify `NEXTAUTH_URL` matches frontend URL
   - Ensure backend CORS settings include frontend URL

2. **API Connection Issues**:
   - Verify backend is running on port 8000
   - Check network connectivity between frontend and backend
   - Validate API endpoints in `src/lib/constants.ts`

3. **Build Errors**:
   - Run `npm run lint` to check for linting issues
   - Verify all TypeScript types are correct
   - Check for missing dependencies

### Development Tips

- Use React Query DevTools for debugging API calls
- Check browser console for authentication issues
- Use Next.js built-in TypeScript support for type checking
- Leverage Tailwind CSS utilities for responsive design

## Deployment Status

- Infrastructure: ✅ Deployed (AWS EC2)
- Backend: ✅ Active (http://107.21.145.151:8000)
- Frontend: ✅ Active (http://107.21.145.151:3000)
- Database: ✅ PostgreSQL in Docker
- Cache: ✅ Redis in Docker
- CI/CD: ✅ GitHub Actions configured

## License

This project is proprietary software.
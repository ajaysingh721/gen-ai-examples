# Authentication

This guide covers authentication and authorization in the Clinical Document Analyzer application.

## Overview

The application uses **NextAuth.js** (also known as Auth.js) for authentication. This is a complete authentication solution for Next.js applications.

**Authentication Type**: Credentials-based (username/password)

**Session Management**: JWT (JSON Web Tokens)

## Architecture

### Frontend Authentication

- **Library**: NextAuth v4
- **Location**: `frontend/src/app/api/auth/[...nextauth]/route.ts`
- **Session Provider**: Wraps the entire app
- **Protected Routes**: Implemented via middleware or layout checks

### Backend Authentication

- **Current Status**: No authentication required for API endpoints
- **Recommendation**: Add API authentication for production

## Default Credentials

### Admin Account

**Username**: `admin`  
**Password**: `admin123`

> ⚠️ **Security Warning**: Change these credentials before deploying to production!

## Configuration

### Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials (change these!)
NEXTAUTH_ADMIN_USERNAME=admin
NEXTAUTH_ADMIN_PASSWORD=admin123
```

### Generating a Secret

Generate a secure random secret for `NEXTAUTH_SECRET`:

**Using OpenSSL**:
```bash
openssl rand -base64 32
```

**Using Node.js**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Using Online Tool**:
Visit: https://generate-secret.vercel.app/32

### Environment Variables Explained

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXTAUTH_SECRET` | Secret key for JWT encryption | Yes | None |
| `NEXTAUTH_URL` | Application base URL | Yes | http://localhost:3000 |
| `NEXTAUTH_ADMIN_USERNAME` | Admin username | No | admin |
| `NEXTAUTH_ADMIN_PASSWORD` | Admin password | No | admin123 |

## NextAuth Configuration

### Route Handler

**File**: `frontend/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const adminUsername = process.env.NEXTAUTH_ADMIN_USERNAME || 'admin'
        const adminPassword = process.env.NEXTAUTH_ADMIN_PASSWORD || 'admin123'

        if (
          credentials?.username === adminUsername &&
          credentials?.password === adminPassword
        ) {
          return {
            id: '1',
            name: adminUsername,
            email: `${adminUsername}@example.com`
          }
        }
        
        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  session: {
    strategy: "jwt"
  }
})

export { handler as GET, handler as POST }
```

## Authentication Flow

### Login Process

1. **User visits protected route** (e.g., `/`)
2. **Session check**: NextAuth checks for valid session
3. **No session found**: User redirected to `/login`
4. **Login form displayed**: User enters credentials
5. **Form submission**: Credentials sent to NextAuth API
6. **Validation**: `authorize()` function validates credentials
7. **Session created**: JWT token issued on success
8. **Redirect**: User sent to original destination or `/`

### Logout Process

1. **User clicks logout**: Triggers `signOut()` function
2. **Session destroyed**: JWT invalidated
3. **Redirect**: User sent to `/login`

## Client-Side Usage

### Session Provider

Wrap your app with `SessionProvider`:

```typescript
// frontend/src/app/layout.tsx
import { SessionProvider } from "next-auth/react"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

### useSession Hook

Access session data in client components:

```typescript
"use client"

import { useSession } from "next-auth/react"

export default function Profile() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    return <div>Access Denied</div>
  }

  return (
    <div>
      <p>Signed in as {session?.user?.name}</p>
    </div>
  )
}
```

### signIn Function

Programmatically sign in:

```typescript
"use client"

import { signIn } from "next-auth/react"

export default function LoginForm() {
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const result = await signIn("credentials", {
      username: e.target.username.value,
      password: e.target.password.value,
      redirect: false
    })

    if (result?.error) {
      console.error("Login failed")
    } else {
      // Redirect on success
      window.location.href = "/"
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### signOut Function

Log out the user:

```typescript
"use client"

import { signOut } from "next-auth/react"

export default function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/login' })}>
      Logout
    </button>
  )
}
```

## Server-Side Usage

### Get Session in Server Component

```typescript
import { getServerSession } from "next-auth"

export default async function ProtectedPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  return <div>Welcome, {session.user.name}</div>
}
```

### Get Session in API Route

```typescript
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({ data: "Protected data" })
}
```

## Protecting Routes

### Option 1: Layout-Level Protection

**File**: `frontend/src/app/(protected)/layout.tsx`

```typescript
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export default async function ProtectedLayout({ children }) {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div>
      {/* Sidebar, header, etc. */}
      {children}
    </div>
  )
}
```

### Option 2: Page-Level Protection

```typescript
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  return <div>Dashboard Content</div>
}
```

### Option 3: Middleware (Global)

**File**: `frontend/src/middleware.ts`

```typescript
import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  },
})

export const config = {
  matcher: ['/((?!login|api/auth).*)']
}
```

## Session Configuration

### JWT Strategy

The app uses JWT (JSON Web Tokens) for sessions:

**Benefits**:
- No server-side session storage needed
- Scalable across multiple servers
- Fast validation

**Configuration**:
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,    // 24 hours
}
```

### Database Strategy (Alternative)

For production, consider database sessions:

```typescript
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database"
  },
  // ...
}
```

## Custom Login Page

The login page is located at `frontend/src/app/login/page.tsx`:

**Features**:
- Custom form styling
- Error messages
- Loading states
- No sidebar (standalone layout)

**Customization**:
- Update form fields
- Change styling
- Add password reset link
- Add "Remember me" checkbox

## Backend API Authentication

### Current Status

Backend API endpoints are **not authenticated**. Anyone can:
- Upload documents
- List documents
- Delete documents

### Adding API Authentication

**Recommended Approaches**:

#### 1. JWT Tokens

Share NextAuth JWT with backend:

```typescript
// Frontend: Send JWT in headers
const session = await getSession()
fetch('http://localhost:8000/api/v1/documents', {
  headers: {
    'Authorization': `Bearer ${session.accessToken}`
  }
})

// Backend: Verify JWT
from jose import jwt

def verify_token(token: str):
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return payload
```

#### 2. API Keys

Generate API keys for backend:

```python
# Backend: Check API key header
from fastapi import Header, HTTPException

def verify_api_key(x_api_key: str = Header()):
    if x_api_key != os.environ.get("API_KEY"):
        raise HTTPException(status_code=403, detail="Invalid API Key")
```

#### 3. Session-Based

Use cookie-based sessions:

```python
# Backend: Verify session cookie
from fastapi import Request, HTTPException

def verify_session(request: Request):
    session = request.cookies.get("session")
    if not session or not validate_session(session):
        raise HTTPException(status_code=401, detail="Unauthorized")
```

## Security Best Practices

### 1. Environment Variables

- ✅ Store secrets in `.env.local`
- ✅ Never commit `.env.local` to Git
- ✅ Use different secrets for dev/staging/prod

### 2. Strong Credentials

- ✅ Change default admin password
- ✅ Use strong, unique passwords
- ✅ Consider password complexity requirements

### 3. HTTPS

- ✅ Use HTTPS in production
- ✅ Set `NEXTAUTH_URL` to HTTPS URL
- ✅ Enable secure cookies in production

### 4. CSRF Protection

- ✅ NextAuth includes CSRF protection
- ✅ Ensure cookies are HttpOnly
- ✅ Use SameSite cookie attribute

### 5. Rate Limiting

- ✅ Implement rate limiting on login attempts
- ✅ Use exponential backoff
- ✅ Log failed attempts

## Multiple Users (Future Enhancement)

Current implementation supports only one admin user. To add multiple users:

### Option 1: Database Users

```typescript
async authorize(credentials) {
  const user = await db.user.findUnique({
    where: { username: credentials.username }
  })
  
  if (user && await bcrypt.compare(credentials.password, user.password)) {
    return { id: user.id, name: user.username }
  }
  
  return null
}
```

### Option 2: Environment Variables

```typescript
// Support multiple admin accounts
const admins = [
  { username: process.env.ADMIN1_USERNAME, password: process.env.ADMIN1_PASSWORD },
  { username: process.env.ADMIN2_USERNAME, password: process.env.ADMIN2_PASSWORD }
]

async authorize(credentials) {
  const admin = admins.find(
    a => a.username === credentials.username && a.password === credentials.password
  )
  
  if (admin) {
    return { id: admin.username, name: admin.username }
  }
  
  return null
}
```

## Troubleshooting

### "No session found" on protected routes

**Solution**:
1. Check that SessionProvider wraps your app
2. Verify NEXTAUTH_SECRET is set
3. Clear browser cookies and try again

### Login redirects but session not persisted

**Solution**:
1. Check NEXTAUTH_URL matches your domain
2. Ensure cookies are enabled in browser
3. Verify JWT strategy is configured

### "authorize() returned null"

**Solution**:
1. Verify credentials match environment variables
2. Check for typos in username/password
3. Console.log credentials in authorize() to debug

### Session expired unexpectedly

**Solution**:
1. Increase maxAge in session config
2. Check server/client time synchronization
3. Verify JWT secret hasn't changed

## Next Steps

- Implement database-backed user management
- Add role-based access control (RBAC)
- Implement password reset functionality
- Add two-factor authentication (2FA)
- Set up OAuth providers (Google, GitHub, etc.)
- Implement audit logging for authentication events

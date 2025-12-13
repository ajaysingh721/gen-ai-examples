# Frontend Architecture

This document describes the architecture, structure, and key components of the Next.js frontend application.

## Overview

The frontend is built with **Next.js 16** using the App Router, featuring:

- Server Components by default
- File-based routing
- Modern React 19 features
- Type-safe with TypeScript
- Styled with Tailwind CSS v4
- Component library: shadcn/ui

## Directory Structure

```
frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Redirect to protected area
│   │   ├── login/
│   │   │   └── page.tsx       # Login page (no sidebar)
│   │   ├── (protected)/       # Protected route group
│   │   │   ├── layout.tsx     # Protected layout with sidebar
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── upload/
│   │   │   │   └── page.tsx   # Upload & Summarize page
│   │   │   └── documents/
│   │   │       └── page.tsx   # Recent Documents page
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts  # NextAuth API route
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ... (more components)
│   │   ├── sidebar.tsx        # Sidebar navigation
│   │   ├── breadcrumb.tsx     # Breadcrumb navigation
│   │   └── ... (other components)
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utility functions
│       ├── utils.ts           # cn() and other utilities
│       └── auth.ts            # NextAuth configuration
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Key Concepts

### App Router

Next.js 16 uses the App Router (not Pages Router):

- Routes are defined by folder structure in `src/app/`
- Each route can have `page.tsx` (page component)
- Each route can have `layout.tsx` (shared layout)
- Special files: `loading.tsx`, `error.tsx`, `not-found.tsx`

### Route Groups

Route groups organize routes without affecting URL structure:

- `(protected)/` - Groups protected pages
- URL doesn't include `(protected)` in the path
- Allows shared layouts for grouped routes

### Server vs Client Components

- **Server Components** (default): Render on server, no JavaScript sent to client
- **Client Components**: Use `"use client"` directive at top of file
- Client components needed for:
  - Interactive features (onClick, onChange)
  - React hooks (useState, useEffect)
  - Browser APIs

## Pages and Routing

### Public Routes

#### Login Page (`/login`)

**File**: `src/app/login/page.tsx`

**Features:**

- No sidebar layout (standalone page)
- Uses NextAuth credentials provider
- Form with username and password
- Client component for form handling
- Redirects to `/` (dashboard) on success

**Default Credentials:**

- Username: `admin`
- Password: `admin123`

### Protected Routes

All routes under `(protected)` require authentication.

#### Dashboard (`/`)

**File**: `src/app/(protected)/page.tsx`

**Features:**

- Main landing page after login
- Shows overview/welcome message
- Statistics or quick actions
- Links to main features

#### Upload & Summarize (`/upload`)

**File**: `src/app/(protected)/upload/page.tsx`

**Features:**

- File upload form
- Accepts PDF and TIFF files
- Calls backend API: `POST /api/v1/documents/analyze`
- Shows loading state during analysis
- Displays results:
  - Document type classification
  - AI-generated summary
  - Text length
- Error handling for upload failures

**Implementation Highlights:**

```typescript
// Client component for interactivity
"use client";

// File upload handling
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    "http://localhost:8000/api/v1/documents/analyze",
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();
  // Display result
};
```

#### Recent Documents (`/api/v1/documents`)

**File**: `src/app/(protected)/api/v1/documents/page.tsx`

**Features:**

- Lists recently analyzed documents
- Fetches from backend: `GET /api/v1/documents?limit=20`
- Table/list view showing:
  - Filename
  - Document type
  - Summary (truncated)
  - Timestamp
- Can be expanded to show full details
- Optional: Delete functionality

## Layouts

### Root Layout

**File**: `src/app/layout.tsx`

**Purpose:**

- Wraps entire application
- Includes `<html>` and `<body>` tags
- Provides SessionProvider for NextAuth
- Global styles and fonts
- Theme provider (if using dark mode)

### Protected Layout

**File**: `src/app/(protected)/layout.tsx`

**Purpose:**

- Wraps all protected routes
- Includes sidebar navigation
- Includes breadcrumb component
- Checks authentication status
- Redirects to login if not authenticated

**Structure:**

```typescript
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Breadcrumb />
        {children}
      </main>
    </div>
  );
}
```

## Components

### UI Components (`components/ui/`)

Built with **shadcn/ui** - a collection of reusable components:

- **Button**: Action buttons with variants (default, destructive, outline, ghost)
- **Card**: Content containers with header, body, footer
- **Input**: Text input fields
- **Label**: Form labels
- **Dialog**: Modal dialogs
- **Separator**: Visual dividers
- **Tooltip**: Hover tooltips
- **And more...**

All components are:

- Fully typed with TypeScript
- Styled with Tailwind CSS
- Accessible (ARIA attributes)
- Customizable via props

### Custom Components

#### Sidebar (`components/sidebar.tsx`)

**Features:**

- Navigation menu
- Active route highlighting
- Icons from `lucide-react`
- Links to:
  - Dashboard
  - Upload & Summarize
  - Recent Documents
- User info section
- Logout button

#### Breadcrumb (`components/breadcrumb.tsx`)

**Features:**

- Shows current page path
- Dynamic based on route
- Helps with navigation context
- Clickable parent paths

## Authentication (NextAuth)

### Configuration

**File**: `src/app/api/auth/[...nextauth]/route.ts`

**Provider**: Credentials (username/password)

**Flow:**

1. User submits login form
2. NextAuth calls authorize function
3. Credentials checked against environment variables
4. Session created if valid
5. JWT token issued
6. User redirected to callback URL

**Session Management:**

- Server-side session validation
- Client-side hooks: `useSession()`, `signIn()`, `signOut()`
- Protected routes check session on load

### Protecting Routes

```typescript
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <div>Protected Content</div>;
}
```

## State Management

### Client-Side State

- **React useState**: For component-local state
- **React Hook Form**: For form state and validation
- **No global state library**: Application is simple enough

### Server State

- **Server Components**: Fetch data on server
- **Next.js caching**: Automatic request deduplication
- **No React Query needed**: App Router handles caching

## Styling

### Tailwind CSS v4

**Features:**

- Utility-first CSS framework
- JIT (Just-In-Time) compiler
- Custom configuration in `tailwind.config.ts`
- Dark mode support (optional)

**Common Patterns:**

```tsx
// Flexbox layout
<div className="flex items-center gap-4">

// Grid layout
<div className="grid grid-cols-3 gap-6">

// Responsive design
<div className="w-full md:w-1/2 lg:w-1/3">

// Hover effects
<button className="hover:bg-blue-600 transition">
```

### shadcn/ui Theming

- Uses CSS variables for colors
- Defined in `globals.css`
- Easy to customize
- Supports light/dark themes

### cn() Utility

**File**: `src/lib/utils.ts`

Combines class names intelligently:

```typescript
import { cn } from "@/lib/utils";

<div
  className={cn(
    "base-classes",
    condition && "conditional-classes",
    className // Allow prop override
  )}
/>;
```

## Data Fetching

### From Server Components

```typescript
async function fetchDocuments() {
  const res = await fetch("http://localhost:8000/api/v1/documents", {
    cache: "no-store", // or 'force-cache'
  });
  return res.json();
}

export default async function DocumentsPage() {
  const documents = await fetchDocuments();
  return <DocumentList documents={documents} />;
}
```

### From Client Components

```typescript
"use client";

export default function UploadPage() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/documents")
      .then((res) => res.json())
      .then(setDocuments);
  }, []);

  return <div>...</div>;
}
```

## Form Handling

### React Hook Form + Zod

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export default function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
    // Handle form submission
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>{/* Form fields */}</form>
  );
}
```

## Build and Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Static Export (if applicable)

```bash
npm run build
# Output to 'out/' directory
```

## Performance Optimizations

1. **Server Components**: Reduce client-side JavaScript
2. **Automatic Code Splitting**: Next.js splits code by route
3. **Image Optimization**: Use `<Image>` component
4. **Font Optimization**: Automatic font optimization
5. **Lazy Loading**: Dynamic imports for heavy components

## Environment Variables

Create `.env.local`:

```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_ADMIN_USERNAME=admin
NEXTAUTH_ADMIN_PASSWORD=admin123
NEXTAUTH_URL=http://localhost:3000
```

## TypeScript

- Strict type checking enabled
- Type-safe API calls
- Component props typed
- Prevents runtime errors

## Testing (Future)

Recommended tools:

- **Jest**: Unit testing
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **Cypress**: Alternative E2E testing

## Accessibility

- Semantic HTML
- ARIA attributes (via shadcn/ui)
- Keyboard navigation
- Focus management
- Color contrast compliance

## Browser Support

Supports all modern browsers:

- Chrome
- Firefox
- Safari
- Edge

## Next Steps

- Add document search/filter in frontend
- Implement real-time updates (WebSockets)
- Add user profile management
- Implement dark mode toggle
- Add comprehensive error boundaries
- Implement loading skeletons
- Add toast notifications (via sonner)

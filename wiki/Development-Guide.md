# Development Guide

This guide provides best practices, workflows, and tips for developing and extending the Clinical Document Analyzer application.

## Development Workflow

### Initial Setup

1. **Clone and install**:
   ```bash
   git clone https://github.com/ajaysingh721/gen-ai-examples.git
   cd gen-ai-examples
   ```

2. **Backend setup**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # or .\.venv\Scripts\activate on Windows
   pip install -e .
   ```

3. **Frontend setup**:
   ```bash
   cd frontend
   npm install
   ```

4. **Start services**:
   ```bash
   # Terminal 1: Backend
   cd backend && uvicorn app.main:app --reload

   # Terminal 2: Frontend
   cd frontend && npm run dev

   # Terminal 3: Ollama (if not running as service)
   ollama serve
   ```

### Daily Development

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Update dependencies** (if needed):
   ```bash
   cd backend && pip install -e .
   cd frontend && npm install
   ```

3. **Start development servers** (see above)

4. **Make changes** and test

5. **Commit your work**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

## Code Organization

### Backend Structure

```
backend/app/
├── api/          # API routes and endpoints
├── core/         # Core configuration (DB, settings)
├── models/       # Database models (SQLAlchemy)
├── schemas/      # Pydantic schemas (validation)
└── services/     # Business logic
```

**Best Practices**:

1. **Separation of Concerns**:
   - Routes: Handle HTTP requests/responses only
   - Services: Contain business logic
   - Models: Define database structure
   - Schemas: Validate input/output

2. **Example Flow**:
   ```python
   # Route (api/v1/routes/documents.py)
   @router.post("/analyze")
   async def analyze_document(file: UploadFile):
       text = document_service.extract_text(file)
       result = document_service.analyze(text)
       return result

   # Service (services/document_service.py)
   def analyze(text: str):
       doc_type = classify_document_type(text)
       summary = summarize_document(text)
       return persist_document_analysis(...)
   ```

### Frontend Structure

```
frontend/src/
├── app/          # Next.js App Router pages
├── components/   # React components
│   └── ui/       # shadcn/ui components
├── hooks/        # Custom React hooks
└── lib/          # Utility functions
```

**Best Practices**:

1. **Component Types**:
   - **Server Components**: Default, for static/data-fetching
   - **Client Components**: Use `"use client"` for interactivity

2. **File Naming**:
   - Pages: `page.tsx`
   - Layouts: `layout.tsx`
   - Components: `ComponentName.tsx` (PascalCase)
   - Utilities: `utilName.ts` (camelCase)

3. **Component Structure**:
   ```typescript
   "use client"  // If needed
   
   import { useState } from "react"
   
   interface Props {
     title: string
     onSubmit: () => void
   }
   
   export default function MyComponent({ title, onSubmit }: Props) {
     const [state, setState] = useState("")
     
     return <div>{title}</div>
   }
   ```

## Adding Features

### Adding a New API Endpoint

1. **Define Schema** (`backend/app/schemas/`):
   ```python
   from pydantic import BaseModel
   
   class MyRequest(BaseModel):
       field: str
   
   class MyResponse(BaseModel):
       result: str
   ```

2. **Create Route** (`backend/app/api/v1/routes/`):
   ```python
   from fastapi import APIRouter
   from app.schemas.my_schema import MyRequest, MyResponse
   
   router = APIRouter()
   
   @router.post("/my-endpoint", response_model=MyResponse)
   async def my_endpoint(request: MyRequest):
       result = my_service.process(request.field)
       return MyResponse(result=result)
   ```

3. **Register Route** (`backend/app/api/v1/__init__.py`):
   ```python
   from .routes import my_routes
   
   api_router.include_router(my_routes.router, prefix="/my", tags=["my"])
   ```

4. **Test in Swagger**: http://127.0.0.1:8000/docs

### Adding a New Frontend Page

1. **Create Page** (`frontend/src/app/(protected)/my-page/page.tsx`):
   ```typescript
   export default function MyPage() {
     return (
       <div>
         <h1>My New Page</h1>
       </div>
     )
   }
   ```

2. **Add to Sidebar** (`frontend/src/components/sidebar.tsx`):
   ```typescript
   <Link href="/my-page">
     <Icon />
     My Page
   </Link>
   ```

3. **Test**: Navigate to http://localhost:3000/my-page

### Adding a New shadcn/ui Component

```bash
cd frontend
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
# etc.
```

Components are added to `src/components/ui/`

## Database Changes

### Adding a New Model

1. **Define Model** (`backend/app/models/my_model.py`):
   ```python
   from sqlalchemy import Column, Integer, String
   from app.core.db import Base
   
   class MyModel(Base):
       __tablename__ = "my_table"
       
       id = Column(Integer, primary_key=True, index=True)
       name = Column(String)
   ```

2. **Import in Models Init** (`backend/app/models/__init__.py`):
   ```python
   from .my_model import MyModel
   ```

3. **Recreate Database** (development):
   ```bash
   rm backend/documents.db
   # Restart backend - tables will be created
   ```

### Using Alembic (Recommended for Production)

1. **Install Alembic**:
   ```bash
   pip install alembic
   ```

2. **Initialize**:
   ```bash
   cd backend
   alembic init migrations
   ```

3. **Configure** (`alembic.ini`):
   ```ini
   sqlalchemy.url = sqlite:///./documents.db
   ```

4. **Create Migration**:
   ```bash
   alembic revision --autogenerate -m "Add my_table"
   ```

5. **Apply Migration**:
   ```bash
   alembic upgrade head
   ```

## Testing

### Backend Testing

**Install pytest**:
```bash
pip install pytest pytest-asyncio httpx
```

**Create Tests** (`backend/tests/test_documents.py`):
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analyze_document():
    with open("test.pdf", "rb") as f:
        response = client.post(
            "/api/v1/documents/analyze",
            files={"file": f}
        )
    assert response.status_code == 200
    assert "summary" in response.json()

def test_list_documents():
    response = client.get("/api/v1/documents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

**Run Tests**:
```bash
pytest
```

### Frontend Testing

**Install Testing Libraries**:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

**Create Test** (`frontend/src/components/MyComponent.test.tsx`):
```typescript
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

test('renders component', () => {
  render(<MyComponent title="Test" />)
  expect(screen.getByText('Test')).toBeInTheDocument()
})
```

**Run Tests**:
```bash
npm test
```

## Code Style

### Backend (Python)

**Formatter**: Black
```bash
pip install black
black backend/app/
```

**Linter**: Ruff
```bash
pip install ruff
ruff check backend/app/
```

**Type Checking**: mypy
```bash
pip install mypy
mypy backend/app/
```

**Style Guidelines**:
- Use type hints
- Follow PEP 8
- Use docstrings for functions
- Keep functions small and focused

### Frontend (TypeScript)

**Linter**: ESLint
```bash
npm run lint
```

**Formatter**: Prettier (optional)
```bash
npm install --save-dev prettier
npx prettier --write "src/**/*.{ts,tsx}"
```

**Style Guidelines**:
- Use TypeScript types (avoid `any`)
- Use functional components
- Use arrow functions
- Keep components small

## Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

### Commit Messages

**Format**:
```
<type>: <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```
feat: Add document search functionality

Add search endpoint to backend and search UI to frontend.
Users can now search documents by filename or content.

Closes #123
```

```
fix: Resolve CORS error on document upload

Updated CORS configuration to allow frontend origin.
```

## Debugging

### Backend Debugging

**Using print/logging**:
```python
import logging
logger = logging.getLogger(__name__)

def my_function():
    logger.debug("Debug message")
    logger.info("Info message")
    logger.error("Error message")
```

**Using pdb**:
```python
import pdb

def my_function():
    pdb.set_trace()  # Debugger will pause here
    # ... rest of code
```

**VS Code Launch Config** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload"],
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

### Frontend Debugging

**Browser DevTools**:
- Console: View logs and errors
- Network: Inspect API calls
- React DevTools: Inspect component state

**VS Code Launch Config**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/frontend",
      "console": "integratedTerminal"
    }
  ]
}
```

## Performance Optimization

### Backend

1. **Use async endpoints** for I/O operations:
   ```python
   @router.get("/documents")
   async def list_documents():
       return await db.query(DocumentAnalysis).all()
   ```

2. **Cache expensive operations**:
   ```python
   from functools import lru_cache
   
   @lru_cache(maxsize=128)
   def expensive_operation(param: str):
       # ... computation
   ```

3. **Use database indexes**:
   ```python
   class DocumentAnalysis(Base):
       id = Column(Integer, primary_key=True, index=True)
       created_at = Column(DateTime, index=True)
   ```

### Frontend

1. **Use React.memo** for expensive components:
   ```typescript
   const MyComponent = React.memo(function MyComponent({ data }) {
     // ... component logic
   })
   ```

2. **Lazy load components**:
   ```typescript
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <p>Loading...</p>
   })
   ```

3. **Optimize images**:
   ```typescript
   import Image from 'next/image'
   
   <Image src="/image.jpg" width={500} height={300} alt="..." />
   ```

## Documentation

### Code Comments

**Good Comments**:
```python
# Calculate average based on last 30 days of data
avg = sum(values[-30:]) / 30

# Workaround for Ollama timeout issue (#123)
timeout = 60
```

**Bad Comments**:
```python
# Increment i
i += 1

# Get documents
documents = get_documents()
```

### Docstrings

**Python**:
```python
def classify_document_type(text: str) -> DocumentType:
    """Classify a clinical document using LLM.

    Args:
        text: The document text to classify

    Returns:
        DocumentType enum indicating the classification

    Raises:
        ValueError: If text is empty
    """
    # ... implementation
```

**TypeScript**:
```typescript
/**
 * Uploads a document for analysis
 * @param file - The file to upload
 * @returns Promise resolving to analysis result
 * @throws Error if upload fails
 */
async function uploadDocument(file: File): Promise<AnalysisResult> {
  // ... implementation
}
```

## Environment-Specific Settings

### Development

```python
# backend/app/core/config.py
class Settings:
    debug: bool = True
    reload: bool = True
    log_level: str = "DEBUG"
```

### Production

```python
class Settings:
    debug: bool = False
    reload: bool = False
    log_level: str = "INFO"
```

**Load based on environment**:
```python
import os

ENV = os.getenv("ENV", "development")

if ENV == "production":
    settings = ProductionSettings()
else:
    settings = DevelopmentSettings()
```

## Security Considerations

1. **Never commit secrets**:
   - Add `.env.local` to `.gitignore`
   - Use environment variables
   - Use secret management tools

2. **Validate input**:
   - Use Pydantic schemas
   - Sanitize user input
   - Validate file types

3. **Use HTTPS in production**:
   - Configure SSL certificates
   - Redirect HTTP to HTTPS

4. **Implement rate limiting**:
   ```python
   from slowapi import Limiter
   
   limiter = Limiter(key_func=get_remote_address)
   
   @app.get("/api/endpoint")
   @limiter.limit("5/minute")
   async def endpoint():
       pass
   ```

## Continuous Integration (Future)

### GitHub Actions Example

`.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - run: cd backend && pip install -e . && pytest

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm install && npm test
```

## Useful Commands Cheat Sheet

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
pytest

# Frontend
cd frontend
npm install
npm run dev
npm run build
npm start
npm run lint

# Ollama
ollama list
ollama pull mistral
ollama serve

# Git
git status
git add .
git commit -m "message"
git push
git pull
git checkout -b branch-name

# Database
rm backend/documents.db
sqlite3 backend/documents.db

# Docker (if using)
docker-compose up
docker-compose down
docker-compose logs -f
```

## Resources

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth Docs](https://next-auth.js.org/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [Ollama Docs](https://github.com/jmorganca/ollama)

### Learning
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Next.js Learn](https://nextjs.org/learn)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Next Steps

- Review [Troubleshooting](Troubleshooting.md) for common issues
- Check [Configuration](Configuration.md) for settings
- Read [API Documentation](API-Documentation.md) for endpoint details

# Troubleshooting

This guide covers common issues and their solutions when working with the Clinical Document Analyzer.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Ollama Issues](#ollama-issues)
- [Tesseract OCR Issues](#tesseract-ocr-issues)
- [Authentication Issues](#authentication-issues)
- [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)
- [General Tips](#general-tips)

## Installation Issues

### Python Version Error

**Problem**: "Python 3.12+ is required"

**Solution**:
```bash
# Check Python version
python --version

# If too old, install Python 3.12+
# Windows: Download from python.org
# macOS: brew install python@3.12
# Linux: sudo apt-get install python3.12
```

### Node.js Version Error

**Problem**: "Node.js version mismatch"

**Solution**:
```bash
# Check Node.js version
node --version

# If too old, install current LTS
# Visit: https://nodejs.org/
# Or use nvm:
nvm install --lts
nvm use --lts
```

### pip install fails

**Problem**: "ERROR: Could not install packages"

**Solution**:
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Use virtual environment
python -m venv .venv
.\.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/macOS

# Try installing again
pip install -e .
```

### npm install fails

**Problem**: "npm ERR! code ERESOLVE"

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install with legacy peer deps
npm install --legacy-peer-deps

# Or use npm force
npm install --force
```

## Backend Issues

### Backend won't start

**Problem**: "ModuleNotFoundError: No module named 'app'"

**Solution**:
```bash
# Ensure you're in the backend directory
cd backend

# Activate virtual environment
.\.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/macOS

# Install in editable mode
pip install -e .

# Start from backend directory
uvicorn app.main:app --reload
```

### Port already in use

**Problem**: "ERROR: [Errno 48] Address already in use"

**Solution**:
```bash
# Find process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### Database error on startup

**Problem**: "OperationalError: unable to open database file"

**Solution**:
```bash
# Ensure backend directory is writable
# Check permissions
ls -la backend/

# Create database manually
cd backend
python -c "from app.core.db import Base, engine; Base.metadata.create_all(bind=engine)"
```

### Import errors

**Problem**: "ImportError: cannot import name 'X'"

**Solution**:
```bash
# Reinstall dependencies
pip uninstall -y fastapi sqlalchemy uvicorn
pip install -e .

# Check for circular imports
# Look at import order in files
```

## Frontend Issues

### Frontend won't start

**Problem**: "Error: Cannot find module 'next'"

**Solution**:
```bash
# Ensure you're in frontend directory
cd frontend

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Start development server
npm run dev
```

### Port 3000 already in use

**Problem**: "Port 3000 is already in use"

**Solution**:
```bash
# Find and kill process
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### NextAuth errors

**Problem**: "NextAuth: NEXTAUTH_SECRET not set"

**Solution**:
```bash
# Create .env.local file
cd frontend
cp .env.example .env.local

# Generate secret
openssl rand -base64 32

# Add to .env.local
echo "NEXTAUTH_SECRET=<generated-secret>" >> .env.local
```

### Session not persisting

**Problem**: "User logged out immediately after login"

**Solution**:
1. Clear browser cookies
2. Check NEXTAUTH_URL matches current URL
3. Ensure NEXTAUTH_SECRET is set
4. Check browser console for errors
5. Verify SessionProvider wraps the app

### Build errors

**Problem**: "npm run build" fails

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Check for TypeScript errors
npm run build

# Fix type errors in code
# Then rebuild
```

## Ollama Issues

### Ollama not running

**Problem**: "Connection refused to http://localhost:11434"

**Solution**:
```bash
# Check if Ollama is running
ollama list

# If not running, start it
ollama serve

# Or check service status
# Linux
systemctl status ollama

# macOS
brew services list
```

### Model not found

**Problem**: "model 'mistral' not found"

**Solution**:
```bash
# List installed models
ollama list

# Pull the model
ollama pull mistral

# Verify it's installed
ollama list
```

### Ollama connection timeout

**Problem**: "Request to Ollama timed out"

**Solution**:
1. Check Ollama is running: `ollama list`
2. Test connection: `curl http://localhost:11434/api/version`
3. Check OLLAMA_BASE_URL environment variable
4. Increase timeout in code if needed

### Ollama using wrong GPU

**Problem**: "Ollama not using GPU / slow inference"

**Solution**:
```bash
# Check CUDA availability
nvidia-smi

# Reinstall Ollama with GPU support
# Visit: https://ollama.ai/download

# Check Ollama GPU usage
# Monitor with nvidia-smi while running
```

### Model inference too slow

**Problem**: "Document analysis takes too long"

**Solution**:
1. Use a smaller/faster model: `ollama pull phi`
2. Reduce max_tokens in code
3. Use GPU acceleration if available
4. Truncate input text more aggressively

## Tesseract OCR Issues

### Tesseract not found

**Problem**: "TesseractNotFoundError: tesseract is not installed"

**Solution**:
```bash
# Check installation
tesseract --version

# If not installed:
# Windows: Download from GitHub
# macOS: brew install tesseract
# Linux: sudo apt-get install tesseract-ocr

# Add to PATH (Windows)
# System Properties > Environment Variables > Path
# Add: C:\Program Files\Tesseract-OCR
```

### OCR returns empty text

**Problem**: "TIFF upload succeeds but no text extracted"

**Solution**:
1. Check image quality (should be clear, high contrast)
2. Ensure image is not inverted/rotated
3. Try different TIFF file
4. Check Tesseract language data is installed

### OCR accuracy is poor

**Problem**: "Extracted text is garbled or incorrect"

**Solution**:
1. Improve image quality
2. Use higher DPI scans (300+ DPI recommended)
3. Preprocess image (denoise, deskew, binarize)
4. Install better language data
5. Try different OCR engines if needed

## Authentication Issues

### Cannot login

**Problem**: "Invalid credentials" even with correct password

**Solution**:
1. Check `.env.local` has correct credentials
2. Verify no extra spaces in username/password
3. Check environment variables are loaded:
   ```bash
   # In Next.js server
   console.log(process.env.NEXTAUTH_ADMIN_USERNAME)
   ```
4. Restart Next.js dev server after changing .env.local

### Redirected to login after logging in

**Problem**: "Infinite redirect loop"

**Solution**:
1. Clear browser cookies
2. Check NEXTAUTH_URL is correct
3. Ensure SessionProvider wraps the app
4. Check middleware configuration
5. Verify JWT secret is set

### "Callback URL not allowed"

**Problem**: "Error: Callback URL not allowed"

**Solution**:
```typescript
// In NextAuth config, add:
callbacks: {
  async redirect({ url, baseUrl }) {
    return url.startsWith(baseUrl) ? url : baseUrl
  }
}
```

## Database Issues

### Database locked

**Problem**: "database is locked"

**Solution**:
```bash
# SQLite doesn't handle concurrent writes well
# Wait and retry
# Or switch to PostgreSQL for production

# Check for zombie processes
ps aux | grep python
kill <PID>

# Delete database and recreate
rm backend/documents.db
# Restart backend (will recreate)
```

### Migrations not working

**Problem**: "Table already exists"

**Solution**:
```bash
# Drop and recreate database
rm backend/documents.db

# Or use Alembic for proper migrations
pip install alembic
alembic init migrations
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

### Cannot delete database file

**Problem**: "Permission denied" when deleting documents.db

**Solution**:
```bash
# Stop backend server first
# Then delete
rm backend/documents.db

# Windows: Check if file is locked
# Use Process Explorer or restart
```

## Performance Issues

### Document upload is slow

**Problem**: "Upload takes 30+ seconds"

**Causes and Solutions**:

1. **LLM inference is slow**:
   - Use faster model: `ollama pull phi`
   - Reduce max_tokens
   - Use GPU acceleration

2. **Large file size**:
   - Limit file size on frontend
   - Compress PDFs before upload

3. **OCR is slow**:
   - Reduce TIFF resolution
   - Process fewer pages
   - Use faster OCR engine

### Frontend is slow/unresponsive

**Problem**: "UI lags or freezes"

**Solution**:
1. Check browser console for errors
2. Clear browser cache
3. Disable browser extensions
4. Use React DevTools to profile
5. Optimize re-renders with React.memo

### High memory usage

**Problem**: "Application uses too much RAM"

**Solution**:

**Backend**:
- Close database sessions properly
- Don't load full document text when not needed
- Use pagination for large lists

**Ollama**:
- Use smaller models
- Adjust Ollama memory settings
- Restart Ollama periodically

## CORS Issues

### CORS error in browser

**Problem**: "Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy"

**Solution**:
```python
# In backend/app/main.py, ensure frontend origin is allowed
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Restart backend after changing
```

### Preflight request fails

**Problem**: "OPTIONS request returns 404"

**Solution**:
```python
# Ensure CORS middleware is added
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Include OPTIONS
    allow_headers=["*"],
)
```

## File Upload Issues

### File upload fails

**Problem**: "Error uploading file"

**Possible Causes**:

1. **File too large**:
   - Check backend accepts large files
   - Increase client timeout

2. **Wrong file type**:
   - Ensure file is PDF or TIFF
   - Check file extension

3. **Backend not running**:
   - Verify backend is running on port 8000

4. **CORS issue**:
   - See CORS section above

### PDF extraction fails

**Problem**: "No text extracted from PDF"

**Solution**:
- PDF might be scanned image (use OCR)
- PDF might be encrypted/protected
- Try different PDF file
- Check PDF with `pdfinfo` or similar tool

## General Tips

### Enable Debug Logging

**Backend**:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend**:
```typescript
// Add console.log statements
console.log('Debug:', variable)
```

### Check Versions

```bash
# Python
python --version

# Node.js
node --version

# Ollama
ollama --version

# Tesseract
tesseract --version

# pip packages
pip list

# npm packages
npm list --depth=0
```

### Clear Caches

```bash
# Python cache
find . -type d -name __pycache__ -exec rm -rf {} +

# Next.js cache
rm -rf frontend/.next

# npm cache
npm cache clean --force

# pip cache
pip cache purge
```

### Restart Everything

Sometimes the simplest solution:

```bash
# Stop all servers (Ctrl+C in each terminal)
# Then restart:

# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Ollama (if needed)
ollama serve
```

### Check Network Connectivity

```bash
# Test backend
curl http://localhost:8000/docs

# Test Ollama
curl http://localhost:11434/api/version

# Test frontend
curl http://localhost:3000
```

### Use Process of Elimination

1. Test each component separately
2. Check logs for error messages
3. Isolate the failing component
4. Search error message online
5. Check GitHub issues for similar problems

## Getting Help

If you're still stuck:

1. **Check GitHub Issues**: Search for similar problems
2. **Review Documentation**: Re-read relevant wiki pages
3. **Enable Debug Logging**: Get more details about errors
4. **Minimal Reproduction**: Create smallest example that shows issue
5. **Open Issue**: Include:
   - Error message
   - Steps to reproduce
   - System information
   - Relevant logs

## Common Error Messages

### "EADDRINUSE: address already in use"

→ Port is already in use. See [Port already in use](#port-already-in-use)

### "ModuleNotFoundError"

→ Missing Python dependency. Run `pip install -e .`

### "Cannot find module"

→ Missing Node.js dependency. Run `npm install`

### "Connection refused"

→ Service not running. Check Ollama or backend status

### "Database is locked"

→ Concurrent access to SQLite. See [Database locked](#database-locked)

### "TesseractNotFoundError"

→ Tesseract not installed. See [Tesseract not found](#tesseract-not-found)

### "Session callback error"

→ NextAuth configuration issue. See [Authentication Issues](#authentication-issues)

## Preventive Measures

1. **Use virtual environments**: Isolate Python dependencies
2. **Keep dependencies updated**: Regularly run `pip install --upgrade`
3. **Use version control**: Git helps track changes
4. **Document changes**: Note what you modify
5. **Test incrementally**: Don't change everything at once
6. **Read error messages**: They often contain the solution
7. **Check logs**: Backend and frontend logs are helpful

## Next Steps

- Review [Configuration](Configuration.md) for proper setup
- Check [Development Guide](Development-Guide.md) for best practices
- Read [Getting Started](Getting-Started.md) for initial setup

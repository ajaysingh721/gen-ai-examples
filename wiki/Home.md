# Gen AI Examples — Clinical Document Analyzer Wiki

Welcome to the **Clinical Document Analyzer** wiki! This is a full-stack application that demonstrates the integration of AI/ML capabilities for analyzing clinical documents.

## Overview

The Clinical Document Analyzer is a full-stack example application that:
- Uploads clinical documents (PDF/TIFF formats)
- Extracts text using PDF parsing and TIFF OCR
- Classifies document types using a local LLM
- Generates intelligent summaries via Ollama
- Persists analysis results to SQLite database

## Key Features

- **🔐 Secure Authentication**: NextAuth-based credential authentication
- **📄 Document Processing**: Supports PDF and TIFF file formats
- **🤖 AI-Powered Classification**: Automatically categorizes clinical documents
- **📝 Intelligent Summarization**: Generates concise summaries using local LLM
- **💾 Data Persistence**: SQLite database for storing analysis results
- **🎨 Modern UI**: Built with Next.js, shadcn/ui, and Tailwind CSS

## Technology Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **SQLite**: Lightweight database
- **Ollama**: Local LLM inference (default: Mistral)
- **Tesseract OCR**: Optical character recognition for TIFF files
- **PyPDF**: PDF text extraction

### Frontend
- **Next.js 16**: React framework with App Router
- **NextAuth**: Authentication solution
- **shadcn/ui**: Reusable component library
- **Tailwind CSS v4**: Utility-first CSS framework
- **React Hook Form**: Form validation and handling
- **Zod**: TypeScript-first schema validation

## Wiki Navigation

- **[Getting Started](Getting-Started.md)** - Installation and setup instructions
- **[Backend Architecture](Backend-Architecture.md)** - Backend structure and services
- **[Frontend Architecture](Frontend-Architecture.md)** - Frontend components and routing
- **[API Documentation](API-Documentation.md)** - API endpoints and usage
- **[Authentication](Authentication.md)** - Authentication setup and configuration
- **[Configuration](Configuration.md)** - Environment variables and settings
- **[Development Guide](Development-Guide.md)** - Development workflow and best practices
- **[Troubleshooting](Troubleshooting.md)** - Common issues and solutions

## Quick Links

- **Backend Swagger UI**: http://127.0.0.1:8000/docs
- **Backend ReDoc**: http://127.0.0.1:8000/redoc
- **Frontend**: http://localhost:3000

## Project Structure

```
gen-ai-examples/
├── backend/          # FastAPI backend service
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Core configuration
│   │   ├── models/   # Database models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic
│   └── pyproject.toml
├── frontend/         # Next.js frontend application
│   ├── src/
│   │   ├── app/      # App Router pages
│   │   ├── components/ # UI components
│   │   ├── hooks/    # Custom React hooks
│   │   └── lib/      # Utility functions
│   └── package.json
├── docs/            # Additional documentation
└── wiki/            # Wiki documentation files
```

## Contributing

This is an example project demonstrating Gen AI capabilities. Feel free to explore, learn, and adapt the code for your own use cases.

## License

See the repository root for license information.

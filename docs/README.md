# Wiki Documentation

This directory contains comprehensive wiki documentation for the Clinical Document Analyzer application.

## Overview

The wiki documentation covers:
- Getting started and installation
- Architecture and design
- API reference
- Configuration options
- Authentication setup
- Troubleshooting common issues
- Development best practices

## Wiki Files

| File | Description |
|------|-------------|
| **Home.md** | Overview, key features, and navigation |
| **Getting-Started.md** | Prerequisites, installation, and first run |
| **Backend-Architecture.md** | FastAPI backend structure and components |
| **Frontend-Architecture.md** | Next.js frontend structure and components |
| **API-Documentation.md** | Complete API endpoint reference |
| **Authentication.md** | NextAuth configuration and usage |
| **Configuration.md** | Environment variables and settings |
| **Troubleshooting.md** | Common issues and solutions |
| **Development-Guide.md** | Development workflow and best practices |

## Using with GitHub Wiki

GitHub Wiki is a separate git repository associated with your main repository. To populate your GitHub Wiki with these files:

### Option 1: Manual Upload (Easiest)

1. Navigate to your repository's Wiki tab on GitHub
2. Create a new page for each .md file
3. Copy the content from each file
4. Paste into the GitHub Wiki editor
5. Save each page

### Option 2: Clone and Push (Recommended)

1. **Enable Wiki** on your GitHub repository (if not already enabled):
   - Go to repository Settings
   - Enable "Wikis" under Features

2. **Clone the wiki repository**:
   ```bash
   git clone https://github.com/ajaysingh721/gen-ai-examples.wiki.git
   cd gen-ai-examples.wiki
   ```

3. **Copy wiki files**:
   ```bash
   cp ../wiki/*.md .
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add comprehensive wiki documentation"
   git push origin master
   ```

### Option 3: Using GitHub API (Advanced)

You can use the GitHub API to programmatically create wiki pages. See GitHub's API documentation for details.

## File Naming Convention

GitHub Wiki uses specific naming conventions:
- `Home.md` → Home page (main landing page)
- `Getting-Started.md` → "Getting Started" page
- `API-Documentation.md` → "API Documentation" page
- etc.

GitHub will automatically convert hyphens to spaces in the page titles.

## Updating the Wiki

To update the wiki:

1. **Edit in this directory**: Make changes to the .md files here
2. **Commit to main repo**: Keep the source files versioned
3. **Copy to wiki repo**: Update the GitHub Wiki repository

This keeps your documentation versioned with your code!

## Wiki Navigation

The Home.md file includes a navigation section linking to all other pages. This serves as the table of contents for your wiki.

## Markdown Features

The wiki files use standard GitHub Flavored Markdown:
- Headers (`#`, `##`, `###`)
- Lists (bullet and numbered)
- Code blocks with syntax highlighting
- Tables
- Links (internal and external)
- Bold and italic text
- Blockquotes

## Viewing Locally

To view the wiki locally:

### Using Markdown Preview

Most code editors (VS Code, Atom, etc.) have built-in Markdown preview:
- VS Code: `Ctrl+Shift+V` or `Cmd+Shift+V`
- Right-click → "Open Preview"

### Using a Markdown Viewer

```bash
# Install markdown viewer
npm install -g markdown-server

# Serve wiki directory
cd wiki
markdown-server
# Open http://localhost:8000
```

### Using GitHub Locally

```bash
# Install gh-md-preview
npm install -g gh-md-preview

# Preview a file
gh-md-preview Home.md
```

## Maintaining Documentation

### When to Update

Update wiki documentation when:
- Adding new features
- Changing configuration options
- Modifying API endpoints
- Discovering common issues
- Improving development workflows

### Documentation Checklist

When adding a feature:
- [ ] Update relevant architecture page (Backend/Frontend)
- [ ] Add API documentation (if new endpoints)
- [ ] Update configuration page (if new settings)
- [ ] Add troubleshooting tips (if common issues)
- [ ] Update Getting Started (if setup changes)

## Contributing

When contributing to documentation:

1. **Follow existing style**: Match the tone and format
2. **Be clear and concise**: Use simple language
3. **Include examples**: Code examples help understanding
4. **Add screenshots**: Visual aids are helpful (when applicable)
5. **Test instructions**: Verify steps work as described
6. **Link between pages**: Help readers navigate

## Documentation Style Guide

### Headers

- Use sentence case for headers
- H1 (`#`) for page title
- H2 (`##`) for main sections
- H3 (`###`) for subsections

### Code Blocks

Always specify language for syntax highlighting:

\`\`\`python
def example():
    pass
\`\`\`

\`\`\`bash
npm install
\`\`\`

### Command Examples

Show commands with context:

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source .venv/bin/activate
```

### Cross-References

Link to other wiki pages:
```markdown
See [Configuration](Configuration.md) for details.
```

## Known Limitations

- GitHub Wiki doesn't support nested directories
- All pages are at the root level
- Images must be uploaded separately or use external URLs

## Screenshots and Images

To add images to the wiki:

1. **Upload to wiki**:
   - Clone wiki repository
   - Add images to a subdirectory
   - Reference in Markdown: `![Alt text](path/to/image.png)`

2. **Use GitHub Issues**:
   - Upload image to a GitHub issue
   - Copy the URL
   - Use in wiki: `![Alt text](https://user-images.githubusercontent.com/...)`

3. **Use external hosting**:
   - Upload to Imgur, GitHub assets, etc.
   - Link in wiki

## Search and Discovery

GitHub Wiki includes:
- Full-text search
- Sidebar navigation
- History and version control
- Automatic page linking

## Feedback

If you find errors or have suggestions for the documentation:
1. Open an issue in the main repository
2. Suggest changes via pull request
3. Update the .md files in this directory

## License

Documentation is provided under the same license as the main project.

## Additional Resources

- [GitHub Wiki Documentation](https://docs.github.com/en/communities/documenting-your-project-with-wikis)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [Markdown Guide](https://www.markdownguide.org/)

---

**Last Updated**: December 2025

For questions or issues with the documentation, please open an issue in the main repository.

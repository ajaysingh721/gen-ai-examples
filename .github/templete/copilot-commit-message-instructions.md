# 🧾 Copilot commit message instructions

✍️ Generate a Git commit message for this repository.

## 🧱 Format

- ✅ Use **imperative mood** (e.g., "Add", "Fix", "Refactor").
- 📏 Prefer the structure:
  - 🧷 **Subject line** (max ~72 chars)
  - ↩️ Blank line
  - 🗒️ **Body** with short bullet points (when helpful)

## 🎯 Content rules

- 🧠 Focus on **what changed** and **why**, not implementation trivia.
- 👀 Mention the most important user-visible or behavior changes.
- 🧩 If multiple areas changed, summarize them as bullets.
- 🔒 Do not include secrets, credentials, tokens, or personal data.

## 🗺️ Scope hints for this repo

- 🖥️ Frontend changes: mention route/UI/auth/sidebar changes.
- 🧪 Backend changes: mention API endpoints, OCR, LLM behavior, DB persistence.
- 🧰 Tooling changes: mention tasks, settings, build/run commands.

## 🧷 Examples

🟦 Subject only:

- ✅ "Add mock SSO sign-in option"

🟩 Subject + body:
Add protected-route loading state

- ⏳ Show skeleton during sidebar navigation
- 🧱 Keep layout consistent across protected pages

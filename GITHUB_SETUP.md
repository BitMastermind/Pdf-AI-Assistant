# 🚀 GitHub Setup Instructions

Your project is ready to push to GitHub! Follow these steps:

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `pdf-ai-assistant` (or your preferred name)
   - **Description**: "AI-powered PDF analysis tool with Next.js, FastAPI, and LangChain"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these:

```bash
cd "/Users/ashitverma/Project 1"

# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/pdf-ai-assistant.git

# Push to GitHub
git push -u origin main
```

If you get an authentication error, you may need to:

### Option A: Use GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not installed
brew install gh

# Authenticate
gh auth login

# Then push
git push -u origin main
```

### Option B: Use Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when pushing:

```bash
git push -u origin main
# Username: your_github_username
# Password: your_personal_access_token
```

### Option C: Use SSH (Most Secure)

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Copy the public key: cat ~/.ssh/id_ed25519.pub

# Change remote to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/pdf-ai-assistant.git

# Push
git push -u origin main
```

## Step 3: Verify

1. Go to your repository on GitHub
2. You should see all your files
3. The README.md should display nicely

## Step 4: Add Repository Topics (Optional)

On your GitHub repository page:

1. Click the gear icon ⚙️ next to "About"
2. Add topics: `nextjs`, `fastapi`, `langchain`, `ai`, `pdf`, `rag`, `typescript`, `python`

## Step 5: Add a License (Optional)

If you want to add a license:

```bash
# Create LICENSE file (MIT License example)
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

git add LICENSE
git commit -m "Add MIT License"
git push
```

## 🔒 Important: Security Notes

Before pushing, make sure:

✅ `.env` files are in `.gitignore` (they are!)
✅ API keys are NOT in the code (they're in .env)
✅ `node_modules/` is ignored
✅ `venv/` is ignored
✅ `chroma_db/` is ignored

## 📝 Future Updates

To push future changes:

```bash
git add .
git commit -m "Your commit message"
git push
```

## 🎉 You're Done!

Your project is now on GitHub! Share it with the world! 🌟

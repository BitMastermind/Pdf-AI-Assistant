# 🔐 Fix Authentication Issue

You're getting a permission error because Git is using cached credentials from a different GitHub account (Striver20).

## Solution Options:

### Option 1: Use Personal Access Token (Easiest)

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name it: "Pdf-AI-Assistant"
   - Select scopes: ✅ `repo` (all repo permissions)
   - Click "Generate token"
   - **COPY THE TOKEN** (you won't see it again!)

2. **Push using the token:**
   ```bash
   cd "/Users/ashitverma/Project 1"
   git push -u origin main
   ```
   - When prompted for username: Enter `BitMastermind`
   - When prompted for password: **Paste your token** (not your password!)

### Option 2: Clear Cached Credentials

```bash
# Clear macOS Keychain credentials
git credential-osxkeychain erase
host=github.com
protocol=https
[Press Enter twice]

# Then try pushing again
git push -u origin main
```

### Option 3: Use SSH (Most Secure)

1. **Generate SSH key (if you don't have one):**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Press Enter to accept default location
   # Optionally set a passphrase
   ```

2. **Add SSH key to GitHub:**
   ```bash
   # Copy your public key
   cat ~/.ssh/id_ed25519.pub
   ```
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste the key and save

3. **Change remote to SSH:**
   ```bash
   cd "/Users/ashitverma/Project 1"
   git remote set-url origin git@github.com:BitMastermind/Pdf-AI-Assistant.git
   git push -u origin main
   ```

### Option 4: Use GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not installed
brew install gh

# Authenticate
gh auth login
# Follow prompts, select GitHub.com, HTTPS, authenticate in browser

# Push
git push -u origin main
```

## Quick Fix (Try This First):

```bash
cd "/Users/ashitverma/Project 1"

# Remove cached credentials
git credential reject <<EOF
protocol=https
host=github.com
EOF

# Try pushing (will prompt for credentials)
git push -u origin main
```

Then use your **BitMastermind** username and either:
- Your GitHub password (if 2FA is disabled)
- A Personal Access Token (if 2FA is enabled - recommended)

---

**Recommended:** Use Option 1 (Personal Access Token) - it's the easiest and most secure!


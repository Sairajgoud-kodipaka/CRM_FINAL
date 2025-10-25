# 🔐 CREDENTIALS SECURITY FIX

## 🚨 CRITICAL SECURITY ISSUE IDENTIFIED

**Google Service Account credentials were found in the repository!**

### File Found:
- `jewellery-crm/mangatrai-6bc45a711bae.json` - Contains Google Cloud service account private key

### What Was Exposed:
- Private Key (PEM format)
- Client ID
- Service Account Email
- Project ID

## ✅ FIXES APPLIED

### 1. Updated `.gitignore` Files

**Root `.gitignore`:**
- Added specific credential file patterns
- Added exception rules for non-secret JSON files
- Added patterns: `mangatrai-*.json`, `crmsales-*.json`, `*-*-*-*.json`

**`jewellery-crm/.gitignore`:**
- Added specific Google Cloud credential patterns
- Added exception rules for package.json, tsconfig.json, etc.

### 2. Credential File Patterns Now Blocked:
```
mangatrai-*.json           # Any mangatrai credential files
service-account-*.json     # Service account files
crmsales-*.json           # CRMsales credential files
*-*-*-*.json              # Pattern matching credential filenames
```

### 3. Files Still Allowed:
```
package.json              # Package dependencies
package-lock.json         # Lock files
tsconfig.json            # TypeScript config
next.config.json         # Next.js config
eslintrc.json            # ESLint config
components.json          # Component library config
vercel.json              # Vercel config
```

## 🔴 IMMEDIATE ACTION REQUIRED

### Step 1: Remove Credentials from Git History

**⚠️ WARNING: This will rewrite git history. Make sure you have backups!**

```bash
# Option 1: Remove from all history (RECOMMENDED for sensitive credentials)
# This uses git-filter-repo (must install first)
git filter-repo --path jewellery-crm/mangatrai-6bc45a711bae.json --invert-paths

# Option 2: Use BFG Repo-Cleaner (easier to use)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files mangatrai-6bc45a711bae.json

# Option 3: Manual removal (for recent commits only)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch jewellery-crm/mangatrai-6bc45a711bae.json" \
  --prune-empty --tag-name-filter cat -- --all
```

### Step 2: Force Push to Remote

```bash
# ⚠️ WARNING: This will rewrite remote history!
git push origin --force --all
git push origin --force --tags
```

### Step 3: Revoke and Recreate Google Cloud Credentials

**MOST IMPORTANT**: The exposed credentials need to be invalidated:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to**: IAM & Admin → Service Accounts
3. **Find the service account**: `presales@mangatrai.iam.gserviceaccount.com`
4. **Delete the existing key** or disable the service account
5. **Create new credentials** with a new key
6. **Store new credentials securely**:
   - Use environment variables
   - Use secret management (AWS Secrets Manager, Google Secret Manager, etc.)
   - Never commit to git

### Step 4: Update Environment Variables

Update your deployment to use environment variables instead:

```bash
# Set environment variable
export GOOGLE_SHEETS_CREDENTIALS_JSON='{...}'

# Or in .env file (which is gitignored)
GOOGLE_SHEETS_CREDENTIALS_JSON="{...}"
```

## 📋 BEST PRACTICES GOING FORWARD

### 1. Never Commit Credentials
- ✅ Use environment variables
- ✅ Use secret management services
- ✅ Use `.env` files (gitignored)
- ❌ Never commit JSON files with credentials
- ❌ Never commit API keys
- ❌ Never commit private keys

### 2. Use Secret Management
- **AWS**: AWS Secrets Manager
- **Google Cloud**: Google Secret Manager
- **Azure**: Azure Key Vault
- **HashiCorp**: Vault

### 3. Regular Security Audits
```bash
# Search for potential secrets in codebase
git secrets --scan-history

# Or use gitleaks
gitleaks detect --source . --verbose
```

### 4. Pre-commit Hooks
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Check for credentials before commit
if git diff --cached --name-only | grep -E '\.(json|pem|key)$'; then
    echo "⚠️  WARNING: You are committing files that may contain credentials!"
    echo "Please verify these files do not contain sensitive information."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
```

## 🔍 HOW TO CHECK IF CREDENTIALS ARE EXPOSED

### Check Git History
```bash
# Search for specific credential file
git log --all --full-history -- "**/mangatrai-*.json"

# Search for API keys in history
git log -p -S "AIza" --all

# Search for private keys
git log -p -S "BEGIN PRIVATE KEY" --all
```

### Search Current Files
```bash
# Find JSON files
find . -name "*.json" -not -path "*/node_modules/*"

# Search for potential credentials
grep -r "BEGIN PRIVATE KEY" .
grep -r "service_account" . --include="*.json"
```

## 📝 FILES MODIFIED

1. `.gitignore` - Updated credential patterns
2. `jewellery-crm/.gitignore` - Updated credential patterns
3. `CREDENTIALS_SECURITY_FIX.md` - This document

## ⚠️ IMPORTANT NOTES

1. **The credentials file exists locally** but appears to not be in the current git index
2. **Check your remote repository** to see if credentials were pushed
3. **If credentials were pushed to GitHub/GitLab**, they may have been cached or cloned by others
4. **Revoke all exposed credentials immediately**
5. **Rotate all credentials** even if you're unsure if they were exposed
6. **Monitor Google Cloud Console** for unauthorized access

## 🎯 SUMMARY

- ✅ Updated `.gitignore` files to prevent future commits
- ❌ Credentials file exists locally
- ⚠️ Need to remove from git history if committed
- 🔴 MUST revoke and recreate Google Cloud credentials
- 📋 Implement secret management going forward

## 🔗 RESOURCES

- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Git Documentation: filter-branch](https://git-scm.com/docs/git-filter-branch)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Google Cloud: Managing Service Accounts](https://cloud.google.com/iam/docs/service-accounts)

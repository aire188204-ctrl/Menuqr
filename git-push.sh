#!/bin/bash

# Error တက်ရင် script ကို ရပ်ပစ်ဖို့
set -e

echo "========================================="
echo "   Git Repository Automater for Termux   "
echo "========================================="

# ၁။ Git Init ရှိမရှိ စစ်ဆေးပြီး မရှိရင် Init လုပ်မယ်
if [ ! -d ".git" ]; then
    echo "[+] Initializing empty Git repository..."
    git init
    git branch -m main
else
    echo "[*] Git repository already initialized."
fi

# ၂။ Git User Config တောင်းမယ် (မရှိသေးရင် သတ်မှတ်ဖို့)
CURRENT_USER=$(git config user.name || echo "")
CURRENT_EMAIL=$(git config user.email || echo "")

if [ -z "$CURRENT_USER" ] || [ -z "$CURRENT_EMAIL" ]; then
    echo "--- Git User Configuration ---"
    read -p "Enter GitHub Username: " gh_user
    read -p "Enter GitHub Email: " gh_email
    
    git config --global user.name "$gh_user"
    git config --global user.email "$gh_email"
    echo "[+] Git identity updated configuration."
fi

# ၃။ Remote Origin ရှိမရှိ စစ်မယ်
if ! git remote | grep -q "origin"; then
    echo "-----------------------------------------"
    read -p "Enter GitHub Repository URL: " repo_url
    if [ -z "$repo_url" ]; then
        echo "[-] Error: Repository URL cannot be empty!"
        exit 1
    fi
    git remote add origin "$repo_url"
    echo "[+] Remote origin added successfully."
else
    echo "[*] Remote origin already exists."
fi

# ၄။ Commit Message တောင်းမယ်
echo "-----------------------------------------"
read -p "Enter commit message (Default: 'initial commit'): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="initial commit"
fi

# ၅။ Git Process ကို ပတ်မယ်
echo "[+] Adding all files..."
git add .

echo "[+] Committing changes..."
git commit -m "$commit_msg"

# ၆။ Branch အမှန်စစ်ပြီး Push မယ်
CURRENT_BRANCH=$(git branch --show-current)
echo "[+] Pushing to GitHub on branch '$CURRENT_BRANCH'..."
git push -u origin "$CURRENT_BRANCH"

echo "========================================="
echo "  🎉 Successfully pushed to GitHub! 🎉   "
echo "========================================="


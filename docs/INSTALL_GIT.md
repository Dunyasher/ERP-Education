# 📥 Install Git on Windows

## 🚀 Quick Installation

### Method 1: Download from Official Website (Recommended)

1. **Visit:** https://git-scm.com/download/win
2. **Download** the latest version (64-bit installer)
3. **Run** the installer (Git-x.x.x-64-bit.exe)
4. **Follow the installation wizard:**
   - Click "Next" through the setup
   - Use default settings (recommended)
   - Choose your editor (VS Code, Notepad++, etc.)
   - Select "Git from the command line and also from 3rd-party software"
   - Click "Install"
5. **Verify installation:**
   ```powershell
   git --version
   ```
   Should show: `git version 2.x.x`

### Method 2: Using Winget (Windows Package Manager)

If you have Windows 10/11 with winget:

```powershell
winget install --id Git.Git -e --source winget
```

### Method 3: Using Chocolatey

If you have Chocolatey installed:

```powershell
choco install git
```

---

## ✅ Verify Installation

After installation, **restart your PowerShell** and run:

```powershell
git --version
```

You should see something like:
```
git version 2.42.0.windows.2
```

---

## 🔧 Post-Installation Setup

### Configure Git (First Time)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Verify Configuration

```powershell
git config --list
```

---

## 📝 Next Steps

Once Git is installed, you can:

1. **Initialize a repository:**
   ```powershell
   git init
   ```

2. **Clone a repository:**
   ```powershell
   git clone <repository-url>
   ```

3. **Check status:**
   ```powershell
   git status
   ```

---

## 🆘 Troubleshooting

**If `git` command is not recognized after installation:**

1. **Restart PowerShell/Terminal** (required after installation)
2. **Check PATH:**
   - Git should be in: `C:\Program Files\Git\cmd\`
   - If not, add it manually to System Environment Variables

3. **Verify installation location:**
   ```powershell
   Test-Path "C:\Program Files\Git\cmd\git.exe"
   ```

---

**✅ After installation, restart your terminal and Git will be ready to use!**


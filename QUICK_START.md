# Quick Start Guide - Local Development

## 🚀 Development Workflow

### 1. Install Dependencies (First Time Only)

```bash
npm install
```

### 2. Make Changes

Edit `Code.js` in your local editor (Cursor, VS Code, etc.)

### 3. Run Tests Locally

```bash
# Run all tests once
npm test

# Watch mode - auto-run tests on file changes
npm run test:watch
```

### 4. Verify All Tests Pass

```
✅ Passed: 15
❌ Failed: 0
📈 Total:  15
```

### 5. Push to Google Workspace (When Ready)

Only push to Google Workspace after all local tests pass:

```bash
# Option A: Manual (copy/paste Code.js to Apps Script editor)
# Option B: Use clasp
clasp push
```

---

## 📋 What the Tests Cover

✅ Template placeholder replacement (`[TEMPLATE]` → `OPA_ID ProjectName`)  
✅ Folder creation and duplicate detection  
✅ Form data extraction from submissions  
✅ Recursive folder structure copying  
✅ File renaming with project names  
✅ Confirmation email sending  
✅ Complete end-to-end workflow simulation  

---

## 🔍 Example Test Output

```
▶️  Test 15: Full workflow simulation... ✅ PASSED

   📊 Created folder structure:
   📁 JP-00001 Full Test Project
     📄 ~JP-00001 Full Test Project One Stop~
     📁 00_提案資料
     📁 01_作成資料
     📁 02_受領資料
     📁 03_会議資料
     📁 99_PM
       📄 JP-00001 Full Test Project Stakeholder Register
       📄 JP-00001 Full Test Project Timesheet v20250930
       📄 ~ PM フォルダ内容 ~
```

---

## 💡 Benefits of Local Testing

✅ **Fast** - Instant feedback (no upload time)  
✅ **Safe** - No risk to production data  
✅ **Offline** - Works without internet  
✅ **Free** - No Google Apps Script quotas  
✅ **Confidence** - Know your code works before deploying  

---

## 📚 More Information

- **Full Testing Guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Maintenance Guide**: [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md)
- **README**: [README.md](./README.md)

---

## 🎯 Quick Commands

```bash
# Run tests once
npm test

# Run tests continuously (watches for file changes)
npm run test:watch

# Install dependencies
npm install

# Check what would be committed
git status

# Commit and push changes
git add -A
git commit -m "Your commit message"
git push
```

---

**Remember**: Only push to Google Workspace when all local tests pass! ✅


# Testing Guide - Japan PM Tools Auto Project Folder Creation

This guide explains how to safely test the script before deploying to production.

## Testing Strategy Overview

This project supports **local mock testing** so you can develop and test your code completely locally without pushing to Google Workspace. Only push to Google Workspace when your code is fully ready and tested.

## ⭐ Local Mock Testing (Recommended for Development)

### Overview

This project includes a complete local testing framework that mocks all Google Apps Script APIs (DriveApp, FormApp, MailApp, Logger). You can run tests locally without any connection to Google Workspace.

### Quick Start

```bash
# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Watch mode - auto-run tests on file changes
npm run test:watch
```

### What Gets Tested Locally

The local test suite includes:

✅ **Template placeholder replacement** - Verify `[TEMPLATE]` is replaced correctly  
✅ **Folder creation logic** - Test folder creation and duplicate detection  
✅ **Form data extraction** - Validate form data parsing  
✅ **Recursive folder copying** - Test entire folder structure copying  
✅ **File renaming** - Verify files are renamed correctly  
✅ **Email sending** - Confirm emails are sent with correct data  
✅ **End-to-end workflow** - Full simulation from form submission to completion

### Test Output Example

```
================================================================================
🧪 Running Local Mock Tests for Japan PM Tools
================================================================================

📋 Test Suite: Template Placeholder Replacement

▶️  Test 1: Replace [TEMPLATE] with project name... ✅ PASSED
▶️  Test 2: Replace [TEMPLATE] with special characters... ✅ PASSED
▶️  Test 3: Multiple [TEMPLATE] replacements... ✅ PASSED
▶️  Test 4: No [TEMPLATE] in string... ✅ PASSED
▶️  Test 5: Japanese characters in replacement... ✅ PASSED

📋 Test Suite: Folder Creation

▶️  Test 7: Create new folder... ✅ PASSED
▶️  Test 8: Return existing folder if already exists... ✅ PASSED

...

📋 Test Suite: End-to-End

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

================================================================================
📊 Test Results
================================================================================
✅ Passed: 15
❌ Failed: 0
📈 Total:  15
================================================================================
```

### Development Workflow

1. **Make changes** to `Code.js` locally in your editor
2. **Run tests** with `npm test` to verify changes work
3. **Iterate** - fix any failing tests
4. **Repeat** until all tests pass
5. **Push to Google Workspace** only when ready (see Option 2 below)

### Adding New Tests

Edit `tests/run-tests.js` to add new test cases:

```javascript
runTest('Test 16: Your new test description', () => {
  // Setup test data
  TestHelpers.setupMockFolderStructure('dest-123', 'template-456');
  
  // Execute the function you want to test
  const result = yourFunction('test input');
  
  // Assert expected behavior
  assertEqual(result, 'expected output');
  assert(condition, 'condition should be true');
});
```

### Mock Implementation Details

The testing framework includes complete mocks for:

- **`Logger`** - Logs to console instead of Google's logger
- **`DriveApp`** - In-memory file system simulation
- **`FormApp`** - Mock form responses
- **`MailApp`** - Tracks sent emails without sending
- **`TestHelpers`** - Utilities for setting up test data and assertions

All mocks are in `tests/mocks.js` - you can extend them if needed.

### Benefits of Local Testing

✅ **Fast** - Instant feedback, no upload delay  
✅ **Safe** - No risk of affecting production  
✅ **Offline** - Works without internet  
✅ **Free** - No Google Apps Script quotas  
✅ **Debuggable** - Use console.log, debuggers, etc.  
✅ **CI/CD Ready** - Can integrate with GitHub Actions  

### Limitations

The mocks simulate Google Apps Script behavior but:
- Cannot test actual Google Drive API quirks
- Cannot test network issues or timeouts
- Cannot test permissions or sharing

**Always do final testing in Google Workspace before production deployment** (see Option 2 below).

---

## Option 2: Test Environment in Google Workspace

### Setup Steps

#### Step 1: Create Test Folders in Google Drive

1. **Create a Test Destination Folder**
   - Create a new folder in Google Drive called `TEST - Japan PM Projects`
   - Copy the folder ID from the URL
   - This is where test project folders will be created

2. **Create a Test Template Folder**
   - Duplicate your production template folder
   - Rename it to `TEST - Template Project`
   - Copy the folder ID
   - Make any experimental changes here without affecting production

#### Step 2: Create a Test Google Form

1. Duplicate your production form
2. Rename it to `TEST - Project Folder Creation`
3. Keep the same fields:
   - OPA ID
   - Project Name
   - Email (or your test email)

#### Step 3: Create a Test Script Project

1. Open [Google Apps Script](https://script.google.com)
2. Create a new project named `TEST - Japan PM Tools`
3. Copy your `Code.js` content into the script editor
4. **Update the CONFIG to point to test folders:**

```javascript
const CONFIG = {
  DESTINATION_FOLDER_ID: 'YOUR_TEST_DESTINATION_FOLDER_ID',  // ← Test folder
  DESTINATION_NAME: 'TEST - Japan PM Projects',
  TEMPLATE_FOLDER_ID: 'YOUR_TEST_TEMPLATE_FOLDER_ID',  // ← Test template
  TEMPLATE_PLACEHOLDER: '[TEMPLATE]'
};
```

5. Save the project

#### Step 4: Connect Test Form to Test Script

1. In the Test Script Editor, click "Triggers" (clock icon)
2. Add a new trigger:
   - Function: `onFormSubmit`
   - Event source: "From form"
   - Select your TEST form
   - Event type: "On form submit"
3. Authorize the script when prompted

#### Step 5: Test!

1. Submit your test form with test data:
   - OPA ID: `TEST-001`
   - Project Name: `Test Project`
2. Check the test destination folder for the created project
3. Verify files were copied and renamed correctly
4. Check execution logs: Executions → Click on the run → View logs

### Test Environment Structure

```
Production Environment:
├── Production Form → Production Script
├── Production Destination Folder (0ANQ5Ex6IvvzsUk9PVA)
└── Production Template (1t9heIEB3EZI4IrZjlzk2C8lUT3I00W7e)

Test Environment:
├── TEST Form → TEST Script
├── TEST Destination Folder (your test folder ID)
└── TEST Template (your test template ID)
```

### Benefits
- ✅ Safe isolated testing
- ✅ Won't affect production data
- ✅ Can test with real Google Apps Script environment
- ✅ Easy to verify folder creation and file naming
- ✅ Can experiment freely

### Deployment Process

After successful testing:

1. Update production script's `Code.js` with tested changes
2. Update production template folder if needed
3. Test one more time with production script (optional)
4. Monitor first few production runs

## Option 3: Local Development with clasp

`clasp` (Command Line Apps Script Projects) allows you to develop locally and push to Google Apps Script.

### Installing clasp

```bash
# Install clasp globally
npm install -g @google/clasp

# Login to your Google account
clasp login

# Clone your existing script (or create new)
clasp clone <SCRIPT_ID>
```

### Getting Your Script ID

1. Open your Apps Script project in browser
2. Click "Project Settings" (gear icon)
3. Copy the "Script ID"

### Setup for This Project

```bash
cd /home/ssgoto/src/jp-auto-project-folder-creation

# Clone your script
clasp clone YOUR_SCRIPT_ID

# This creates:
# - .clasp.json (configuration)
# - appsscript.json (manifest)
# - Code.js (your script)
```

### Development Workflow with clasp

```bash
# 1. Make changes to Code.js locally in your editor

# 2. Push changes to Google Apps Script
clasp push

# 3. Open in browser to test
clasp open

# 4. View logs
clasp logs

# 5. Test by submitting form or running function manually
```

### clasp.json Configuration

Create or update `.clasp.json`:

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "."
}
```

### Benefits
- ✅ Use your local editor (Cursor, VS Code, etc.)
- ✅ Version control with git
- ✅ Better code completion
- ✅ Still executes in Google's environment

### Limitations
- ⚠️ Still requires pushing to Google to test
- ⚠️ Must have internet connection
- ⚠️ Cannot run truly offline

## Option 4: Manual Testing in Apps Script Editor

The simplest approach for quick tests:

### Steps

1. Open your Apps Script project in browser
2. Make changes directly in the editor
3. Click "Run" → Select `onFormSubmit`
4. Or submit a test form
5. View logs: View → Logs or Executions

### Testing Without Form Submission

You can test individual functions:

```javascript
// Add this temporary test function
function testScript() {
  // Mock form data
  const testFormData = {
    opaId: 'TEST-001',
    projectName: 'Test Project',
    emailAddress: 'your-email@example.com',
    folderName: 'TEST-001 Test Project'
  };
  
  // Test folder creation
  const projectFolderId = createFolder(CONFIG.DESTINATION_FOLDER_ID, testFormData.folderName);
  Logger.log('Created folder ID: ' + projectFolderId);
  
  // Test template copying
  const templateFolder = DriveApp.getFolderById(CONFIG.TEMPLATE_FOLDER_ID);
  const destinationFolder = DriveApp.getFolderById(projectFolderId);
  copyFolderContents(templateFolder, destinationFolder, testFormData.folderName);
  
  Logger.log('Test completed!');
}
```

Run this function to test without submitting a form.

### Benefits
- ✅ Quick and simple
- ✅ No additional setup
- ✅ Direct access to logs

### Limitations
- ⚠️ Manual process
- ⚠️ No version control in editor
- ⚠️ Risk of accidentally modifying production

## Option 5: Unit Testing with Gas-Unit (Advanced)

For comprehensive testing, you can write unit tests.

### Install gas-unit

```bash
npm install -D gas-unit
```

### Example Unit Test

Create `Code.test.js`:

```javascript
// Mock Google Apps Script services
const mockDriveApp = {
  getFolderById: (id) => ({
    getName: () => 'Mock Folder',
    getFolders: () => ({ hasNext: () => false }),
    getFiles: () => ({ hasNext: () => false }),
    createFolder: (name) => ({ getId: () => 'mock-id-123' })
  })
};

// Test placeholder replacement
function testReplaceTemplatePlaceholder() {
  const CONFIG = { TEMPLATE_PLACEHOLDER: '[TEMPLATE]' };
  
  function replaceTemplatePlaceholder(text, replacementText) {
    const escapedPlaceholder = CONFIG.TEMPLATE_PLACEHOLDER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escapedPlaceholder, 'g'), replacementText);
  }
  
  // Test cases
  const tests = [
    {
      input: '[TEMPLATE] One Stop',
      replacement: 'JP-12345 Test Project',
      expected: 'JP-12345 Test Project One Stop'
    },
    {
      input: '~[TEMPLATE] One Stop~',
      replacement: 'JP-12345 Test',
      expected: '~JP-12345 Test One Stop~'
    },
    {
      input: 'No Template Here',
      replacement: 'JP-12345 Test',
      expected: 'No Template Here'
    }
  ];
  
  tests.forEach(test => {
    const result = replaceTemplatePlaceholder(test.input, test.replacement);
    if (result !== test.expected) {
      throw new Error(`Expected "${test.expected}", got "${result}"`);
    }
    console.log(`✓ Test passed: ${test.input}`);
  });
}

// Run tests
testReplaceTemplatePlaceholder();
```

### Running Unit Tests Locally

```bash
node Code.test.js
```

### Benefits
- ✅ True local testing
- ✅ Fast feedback
- ✅ Good for logic testing

### Limitations
- ⚠️ Cannot test Google Apps Script APIs
- ⚠️ Requires mocking
- ⚠️ More setup required

## Recommended Testing Workflow

### For All Changes (Recommended)
1. **Develop locally** - Make changes to `Code.js` in your editor
2. **Run local tests** - `npm test` to verify logic works
3. **Fix any issues** - Iterate until all tests pass
4. **Test in Google Workspace** - Use test environment (Option 2) for final validation
5. **Deploy to production** - Only when fully tested

### For Small Changes
1. Run local mock tests (`npm test`)
2. If all pass, deploy to production
3. Monitor first few runs

### For Major Changes
1. Run local mock tests (`npm test`)
2. Set up test environment (Option 2)
3. Test thoroughly with multiple scenarios
4. Use clasp for deployment (Option 3)
5. Monitor first few production runs

### For Refactoring
1. Add new test cases to `tests/run-tests.js`
2. Run local tests continuously (`npm run test:watch`)
3. Refactor with confidence
4. Final validation in test environment (Option 2)
5. Deploy to production

## Testing Checklist

Before deploying to production:

- [ ] Test with typical form data
- [ ] Test with special characters in project name
- [ ] Test with long project names
- [ ] Verify all files are copied
- [ ] Verify `[TEMPLATE]` replacement works correctly
- [ ] Check folder structure matches template
- [ ] Verify confirmation email is sent
- [ ] Review execution logs for errors
- [ ] Test with edge cases (empty fields, special characters, etc.)
- [ ] Verify no impact on existing projects

## Common Test Scenarios

### Test Case 1: Basic Functionality
- OPA ID: `JP-12345`
- Project Name: `Customer ABC Implementation`
- Expected: Folder created with proper name, all files copied and renamed

### Test Case 2: Special Characters
- OPA ID: `JP-67890`
- Project Name: `Project & Co. (Test)`
- Expected: Folder created, special characters handled gracefully

### Test Case 3: Long Names
- OPA ID: `JP-11111`
- Project Name: `Very Long Project Name With Many Words In It`
- Expected: All works correctly, no truncation issues

### Test Case 4: Japanese Characters
- OPA ID: `JP-22222`
- Project Name: `テストプロジェクト顧客名`
- Expected: Japanese characters preserved correctly

### Test Case 5: Files Without [TEMPLATE]
- Verify files without `[TEMPLATE]` are copied with original names
- Example: `~ PM フォルダ内容 ~` stays as-is

## Monitoring Production

After deployment:

1. **Watch first few runs**
   - Check Executions tab
   - Verify logs look good
   - Spot-check created folders

2. **Set up notifications**
   - Apps Script can email you on errors
   - Add error handling to send alerts

3. **Regular audits**
   - Periodically check created folders
   - Ensure template copying works correctly
   - Verify naming conventions are followed

## Rollback Plan

If something goes wrong:

1. **Immediate**: Disable the trigger
   - Go to Triggers
   - Click ⋮ menu → Delete trigger
   - This stops automatic execution

2. **Fix**: Revert to previous version
   - Check git history for last working version
   - Update script in Apps Script editor
   - Test in test environment

3. **Re-enable**: Once fixed
   - Re-create the trigger
   - Monitor closely

## Getting Help

If you encounter issues during testing:

1. Check execution logs first
2. Review error messages carefully
3. Check the MAINTENANCE_GUIDE.md troubleshooting section
4. Verify folder IDs and permissions
5. Try in test environment with simplified template

---

**Remember**: Always test in a safe environment before deploying to production!

**Last Updated**: October 28, 2025


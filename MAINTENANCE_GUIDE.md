# Maintenance Guide - Japan PM Tools Auto Project Folder Creation

This guide provides detailed instructions for maintaining and modifying the automated project folder creation system.

## Table of Contents

1. [Understanding the System Architecture](#understanding-the-system-architecture)
2. [Working with the Template Folder](#working-with-the-template-folder)
3. [File Naming Conventions](#file-naming-conventions)
4. [Modifying the Script](#modifying-the-script)
5. [Common Maintenance Tasks](#common-maintenance-tasks)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Understanding the System Architecture

### How the Script Works

```
Google Form Submission
        ↓
onFormSubmit() triggered
        ↓
Extract form data (OPA_ID, Project Name, Email)
        ↓
Create root project folder: "OPA_ID ProjectName"
        ↓
Recursively copy template folder contents
        ↓
Replace [TEMPLATE] with "OPA_ID ProjectName" in all file names
        ↓
Send confirmation email
```

### Key Components

1. **Configuration (`CONFIG` object)**
   - Stores folder IDs and settings
   - Central place for all configurable values

2. **Form Data Extraction (`getFormData()`)**
   - Reads the latest form submission
   - Extracts OPA_ID, Project Name, and Email

3. **Folder Creation (`createFolder()`)**
   - Creates folders if they don't exist
   - Prevents duplicates

4. **Recursive Copying (`copyFolderContents()`)**
   - Copies entire folder structures
   - Processes all subfolders and files
   - Applies naming conventions

5. **Template Replacement (`replaceTemplatePlaceholder()`)**
   - Replaces `[TEMPLATE]` with project identifier
   - Handles special regex characters properly

## Working with the Template Folder

### Template Folder Location

**Current Template Folder**: [~Template Project~](https://drive.google.com/drive/u/0/folders/1t9heIEB3EZI4IrZjlzk2C8lUT3I00W7e)

This folder contains the master template that will be copied for every new project.

### Template Folder Structure

```
~Template Project~
├── 00_提案資料/
│   └── (files and folders here)
├── 01_作成資料/
│   └── (files and folders here)
├── 02_受領資料/
│   └── (files and folders here)
├── 03_会議資料/
│   └── (files and folders here)
├── 99_PM/
│   ├── [TEMPLATE] Stakeholder Register
│   ├── [TEMPLATE] Timesheet (PSAデータ連動)
│   ├── [TEMPLATE] Timesheet v20250930
│   ├── [TEMPLATE] Todo/Issue/Risk/Change Log
│   └── ~ PM フォルダ内容 ~
└── ~[TEMPLATE] One Stop~
```

### Modifying the Template Folder

#### Adding New Files

1. Navigate to the template folder (or appropriate subfolder)
2. Upload or create your new file
3. If the file should include the project identifier, name it with `[TEMPLATE]`
   - Example: `[TEMPLATE] Weekly Status Report`
4. Save/upload the file
5. **No code changes required!** The next form submission will automatically include this file

#### Adding New Folders

1. Create the new folder in the desired location within the template
2. Add any files you want inside it
3. The script will automatically recreate this folder structure for new projects
4. **No code changes required!**

#### Removing Files or Folders

1. Simply delete the file or folder from the template
2. Future project creations will not include the deleted items
3. Existing projects are not affected

#### Reorganizing Structure

1. Move files and folders within the template as desired
2. The script copies the structure exactly as it appears
3. Test with a form submission to verify the new structure

## File Naming Conventions

### The [TEMPLATE] Placeholder

**Purpose**: Any occurrence of `[TEMPLATE]` in a file name will be replaced with the full project identifier.

**Format**: `OPA_ID + " " + ProjectName`

**Example**:
- Form Input:
  - OPA_ID: `JP-12345`
  - Project Name: `Customer ABC Implementation`
- Result: `JP-12345 Customer ABC Implementation`

### Naming Rules

1. **Use `[TEMPLATE]` for project-specific files**
   ```
   ✅ Good: [TEMPLATE] Kickoff Meeting Notes
   ✅ Good: [TEMPLATE] - Project Plan v1.0
   ✅ Good: Weekly Report - [TEMPLATE]
   ```

2. **Don't use `[TEMPLATE]` for general reference files**
   ```
   ✅ Good: ~ PM フォルダ内容 ~
   ✅ Good: Template Instructions.pdf
   ✅ Good: General Guidelines
   ```

3. **Multiple placeholders are supported**
   ```
   ✅ [TEMPLATE] - [TEMPLATE] Budget
   Results in: JP-12345 Customer ABC - JP-12345 Customer ABC Budget
   
   (Though typically one placeholder is sufficient)
   ```

4. **Case sensitive**
   ```
   ✅ Correct: [TEMPLATE]
   ❌ Wrong: [template]
   ❌ Wrong: [Template]
   ```

5. **Exact match required**
   ```
   ✅ Correct: [TEMPLATE]
   ❌ Wrong: [TEMPLATE ]  (extra space inside)
   ❌ Wrong: [ TEMPLATE ] (spaces inside)
   ❌ Wrong: {TEMPLATE}   (wrong brackets)
   ```

### Naming Examples

| Template Name | OPA_ID | Project Name | Result |
|---|---|---|---|
| `[TEMPLATE] One Stop` | JP-12345 | Test Project | `JP-12345 Test Project One Stop` |
| `~[TEMPLATE] One Stop~` | JP-12345 | Test Project | `~JP-12345 Test Project One Stop~` |
| `[TEMPLATE] Stakeholder Register` | JP-67890 | Client XYZ | `JP-67890 Client XYZ Stakeholder Register` |
| `Weekly Status Report` | JP-12345 | Test Project | `Weekly Status Report` (unchanged) |
| `~ PM フォルダ内容 ~` | JP-12345 | Test Project | `~ PM フォルダ内容 ~` (unchanged) |

## Modifying the Script

### Configuration Changes

#### Changing the Destination Folder

To create projects in a different location:

```javascript
const CONFIG = {
  DESTINATION_FOLDER_ID: 'YOUR_NEW_FOLDER_ID_HERE',  // ← Update this
  // ... rest of config
};
```

**How to get a folder ID:**
1. Open the folder in Google Drive
2. Look at the URL: `https://drive.google.com/drive/folders/{FOLDER_ID}`
3. Copy the `FOLDER_ID` portion

#### Changing the Template Folder

To use a different template:

```javascript
const CONFIG = {
  // ... other config
  TEMPLATE_FOLDER_ID: 'YOUR_NEW_TEMPLATE_ID_HERE',  // ← Update this
  // ... rest of config
};
```

#### Changing the Placeholder Text

To use something other than `[TEMPLATE]`:

```javascript
const CONFIG = {
  // ... other config
  TEMPLATE_PLACEHOLDER: '[PROJECT]'  // ← Use whatever you want
};
```

Then rename files in your template folder accordingly.

### Form Field Changes

If your form structure changes, update the `getFormData()` function:

```javascript
function getFormData() {
  const formResponses = FormApp.getActiveForm().getResponses();
  const lastResponse = formResponses[formResponses.length - 1];
  const itemResponses = lastResponse.getItemResponses();
  
  // Update these indices based on your form field order
  const opaId = itemResponses[0].getResponse();        // ← Field 1
  const projectName = itemResponses[1].getResponse();  // ← Field 2
  const emailAddress = lastResponse.getRespondentEmail();
  
  return {
    opaId,
    projectName,
    emailAddress,
    folderName: `${opaId} ${projectName}`  // ← Adjust format if needed
  };
}
```

### Adding Custom Logic

#### Example: Add conditional file copying

```javascript
function copyFolderContents(sourceFolder, destinationFolder, replacementText) {
  Logger.log(`Copying contents from "${sourceFolder.getName()}" to "${destinationFolder.getName()}"`);
  
  const files = sourceFolder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const originalFileName = file.getName();
    
    // Add custom logic here
    if (originalFileName.includes('INTERNAL') && !isInternalProject(replacementText)) {
      Logger.log(`Skipping internal file: ${originalFileName}`);
      continue;  // Skip this file
    }
    
    const newFileName = replaceTemplatePlaceholder(originalFileName, replacementText);
    Logger.log(`Copying file: "${originalFileName}" as "${newFileName}"`);
    file.makeCopy(newFileName, destinationFolder);
  }
  
  // ... rest of function
}
```

## Common Maintenance Tasks

### Task 1: Adding a New Template Document

**Scenario**: You want all new projects to include a "Risk Register" document.

**Steps**:
1. Create or upload the Risk Register to the template folder (in the appropriate subfolder, e.g., `99_PM/`)
2. Name it: `[TEMPLATE] Risk Register`
3. Done! Next form submission will include it

**Time Required**: 2 minutes  
**Code Changes**: None

### Task 2: Changing Folder Structure

**Scenario**: You want to add a new folder called `04_納品物` (Deliverables)

**Steps**:
1. In the template folder, create a new folder named `04_納品物`
2. Add any files you want inside it
3. Done! Next form submission will create this folder

**Time Required**: 3 minutes  
**Code Changes**: None

### Task 3: Updating an Existing Template File

**Scenario**: The timesheet template needs to be updated.

**Steps**:
1. Open `[TEMPLATE] Timesheet v20250930` in the template folder
2. Make your changes
3. Save
4. Done! Future projects get the updated version

**Note**: This does NOT update previously created projects.

**Time Required**: Depends on edits  
**Code Changes**: None

### Task 4: Removing an Obsolete File

**Scenario**: The "Sales to Delivery" checklist is no longer needed.

**Steps**:
1. Find the file in the template folder
2. Delete it
3. Done! Future projects won't include it

**Time Required**: 1 minute  
**Code Changes**: None

### Task 5: Changing the Project Folder Naming Convention

**Scenario**: You want to change from `OPA_ID ProjectName` to `ProjectName (OPA_ID)`

**Steps**:
1. Open `Code.js` in the Apps Script editor
2. Find the `getFormData()` function
3. Change line:
   ```javascript
   folderName: `${opaId} ${projectName}`
   ```
   To:
   ```javascript
   folderName: `${projectName} (${opaId})`
   ```
4. Save
5. Test with a form submission

**Time Required**: 5 minutes  
**Code Changes**: 1 line

### Task 6: Migrating to a New Template Folder

**Scenario**: You want to create a new template folder and use that instead.

**Steps**:
1. Create a new folder in Google Drive
2. Set up your desired template structure
3. Copy the folder ID from the URL
4. Open `Code.js` in the Apps Script editor
5. Update the `CONFIG` object:
   ```javascript
   const CONFIG = {
     // ... other settings
     TEMPLATE_FOLDER_ID: 'YOUR_NEW_FOLDER_ID',
   };
   ```
6. Save and test

**Time Required**: 15 minutes  
**Code Changes**: 1 line

## Troubleshooting

### Issue: Files Not Being Renamed

**Symptoms**: Files are copied but `[TEMPLATE]` is not replaced

**Possible Causes**:
1. Placeholder spelled incorrectly in file name
2. Different brackets used (e.g., `{TEMPLATE}` instead of `[TEMPLATE]`)
3. Extra spaces inside brackets (e.g., `[ TEMPLATE ]`)

**Solution**:
- Check exact spelling in template file names
- Verify `CONFIG.TEMPLATE_PLACEHOLDER` matches what's in file names
- Look at execution logs for error messages

### Issue: Folders Not Being Created

**Symptoms**: Script runs but no folders appear

**Possible Causes**:
1. Incorrect `DESTINATION_FOLDER_ID`
2. Permission issues
3. Script not authorized

**Solution**:
1. Verify the folder ID is correct
2. Ensure the script has Drive permissions
3. Check execution logs: View > Executions
4. Re-authorize the script if needed

### Issue: Template Files Not Copying

**Symptoms**: Empty project folder created

**Possible Causes**:
1. Incorrect `TEMPLATE_FOLDER_ID`
2. Template folder is empty
3. Permission issues

**Solution**:
1. Verify the template folder ID
2. Check that template folder has content
3. Ensure script has read access to template folder
4. Check execution logs

### Issue: Special Characters in Project Name Cause Issues

**Symptoms**: Errors when project name has special characters

**Possible Causes**:
- Some characters are invalid in folder/file names

**Solution**:
- Google Drive handles most characters automatically
- If issues persist, add sanitization to `getFormData()`:
  ```javascript
  const projectName = itemResponses[1].getResponse()
    .replace(/[<>:"/\\|?*]/g, '-');  // Replace invalid chars
  ```

### Issue: Script Times Out

**Symptoms**: Script execution times out before completing

**Possible Causes**:
- Template folder is very large (many files)
- Files are very large
- Network issues

**Solution**:
1. Optimize template folder size
2. Remove unnecessary large files
3. Consider breaking into smaller batches if needed
4. Check Google Apps Script execution time limits

### Issue: Duplicate Folders Created

**Symptoms**: Multiple folders with the same name

**Possible Causes**:
- Multiple form submissions happening quickly
- The `createFolder()` function not detecting existing folder

**Solution**:
- The script already checks for duplicates
- If issues persist, check execution logs
- Consider adding a cooldown period or locking mechanism

### Viewing Execution Logs

To see detailed logs of what the script is doing:

1. Open the Apps Script editor
2. Click on "Executions" (left sidebar)
3. Click on a specific execution to see the log
4. Look for `Logger.log()` outputs showing:
   - Form data extracted
   - Folders being created
   - Files being copied
   - Any error messages

## Best Practices

### Template Folder Management

1. **Keep it organized**
   - Use clear folder names
   - Group related files together
   - Document the structure

2. **Use consistent naming**
   - Apply `[TEMPLATE]` consistently
   - Use clear, descriptive file names
   - Follow Japanese/English naming conventions appropriate for your team

3. **Version control for templates**
   - Consider keeping a changelog
   - Date stamp template versions if needed
   - Example: `[TEMPLATE] Timesheet v20250930`

4. **Test after changes**
   - Submit a test form after modifying templates
   - Verify files are copied and renamed correctly
   - Check folder structure is as expected

5. **Document special files**
   - Create a `~ Template Instructions ~` file explaining the structure
   - Note which files should/shouldn't have `[TEMPLATE]`

### Code Maintenance

1. **Minimal changes**
   - Only modify the script when absolutely necessary
   - Most changes can be done in the template folder

2. **Test in a safe environment**
   - Use a test destination folder for testing
   - Verify before pushing to production

3. **Keep logs**
   - The script includes comprehensive logging
   - Review logs periodically to catch issues

4. **Version control**
   - Commit changes to git with clear messages
   - Document what changed and why

5. **Backup**
   - Keep backups of working script versions
   - Keep backups of template folder periodically

### Form Management

1. **Keep form simple**
   - Only collect necessary information
   - Clear field labels
   - Help text for users

2. **Validate inputs**
   - Consider adding validation to form fields
   - Ensure OPA_ID follows expected format
   - Prevent empty submissions

3. **User communication**
   - Ensure users know where to find created folders
   - Confirmation email includes folder link
   - Provide support contact

## Script Functions Reference

### `onFormSubmit(event)`
Main trigger function. Orchestrates the entire folder creation process.

### `getFormData()`
Extracts form submission data. Returns object with `opaId`, `projectName`, `emailAddress`, and `folderName`.

### `logFormData(formData)`
Logs extracted form data for debugging purposes.

### `copyFolderContents(sourceFolder, destinationFolder, replacementText)`
Recursively copies all contents from source to destination, applying template replacement.

### `replaceTemplatePlaceholder(text, replacementText)`
Replaces `[TEMPLATE]` placeholder with the provided text. Handles special regex characters.

### `sendConfirmationEmail(formData, folderUrl)`
Sends confirmation email to form submitter with link to created folder.

### `getIdFromUrl(url)`
Helper function to extract folder ID from Google Drive URL. (Currently not used but available if needed)

### `createFolder(parentFolderId, folderName)`
Creates a folder if it doesn't exist, returns existing folder ID if it does.

## Support and Resources

### Getting Help

1. Check this maintenance guide
2. Review execution logs
3. Check the [README.md](./README.md)
4. Review git commit history for recent changes

### Useful Links

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [DriveApp Reference](https://developers.google.com/apps-script/reference/drive/drive-app)
- [FormApp Reference](https://developers.google.com/apps-script/reference/forms)
- [Template Folder](https://drive.google.com/drive/u/0/folders/1t9heIEB3EZI4IrZjlzk2C8lUT3I00W7e)

### Contact

For questions or issues, contact the development team or refer to your internal documentation.

---

**Last Updated**: October 27, 2025  
**Script Version**: 2.0  
**Maintainer**: [Your Team/Name]


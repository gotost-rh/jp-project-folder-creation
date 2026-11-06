# Japan PM Tools - Auto Project Folder Creation

Automatically creates standardized project folder structures in Google Drive when a Google Form is submitted.

## Overview

This Google Apps Script automates the creation of project folders by:
- Creating a new project folder based on form submission
- Copying an entire template folder structure with all subfolders and files
- Automatically renaming files by replacing `[TEMPLATE]` with the project identifier

## How It Works

### Form Submission Flow

1. User submits the Google Form with:
   - **OPA ID** (e.g., `JP-12345`)
   - **Project Name** (e.g., `Customer ABC Implementation`)
   - **Email Address** (automatically captured)

2. Script automatically:
   - Creates a root project folder named: `JP-12345 Customer ABC Implementation`
   - Copies all contents from the template folder
   - Renames all files containing `[TEMPLATE]` to `JP-12345 Customer ABC Implementation`
   - Sends confirmation email with folder link

### File Naming Convention

Any file in the template folder with `[TEMPLATE]` in its name will have that placeholder replaced with the full project identifier (OPA_ID + Project Name).

**Examples:**
- Template: `~[TEMPLATE] One Stop~`
  - Result: `~JP-12345 Customer ABC Implementation One Stop~`
  
- Template: `[TEMPLATE] Stakeholder Register`
  - Result: `JP-12345 Customer ABC Implementation Stakeholder Register`
  
- Template: `[TEMPLATE] Timesheet v20250930`
  - Result: `JP-12345 Customer ABC Implementation Timesheet v20250930`

Files without `[TEMPLATE]` in their name are copied as-is.

## Configuration

The script has minimal configuration in the `CONFIG` object:

```javascript
const CONFIG = {
  DESTINATION_FOLDER_ID: '0ANQ5Ex6IvvzsUk9PVA',  // Where to create new project folders
  TEMPLATE_FOLDER_ID: '1t9heIEB3EZI4IrZjlzk2C8lUT3I00W7e',  // Template to copy from
  TEMPLATE_PLACEHOLDER: '[TEMPLATE]'  // Placeholder text to replace
};
```

## Template Folder Management

### Updating the Template

To modify what gets created for new projects:

1. Go to the [template folder](https://drive.google.com/drive/u/0/folders/1t9heIEB3EZI4IrZjlzk2C8lUT3I00W7e)
2. Add, remove, or modify files and folders
3. Use `[TEMPLATE]` in file names where you want the project identifier inserted
4. No code changes needed!

### Adding New Files

1. Upload or create the file in the appropriate folder in the template
2. If you want the project identifier in the name, include `[TEMPLATE]`
3. Done! Next form submission will include this file

### Adding New Folders

1. Create the folder in the template folder structure
2. Add any files you want inside it
3. The script automatically recreates the entire folder structure

### Removing Files or Folders

1. Delete them from the template folder
2. They won't be included in future project creations

## Deployment

### Initial Setup

1. Open [Google Apps Script Editor](https://script.google.com)
2. Create a new project
3. Copy the contents of `Code.js` into the script editor
4. Save the project

### Connecting to Google Form

1. In the Script Editor, click on "Triggers" (clock icon)
2. Click "+ Add Trigger"
3. Configure:
   - Function: `onFormSubmit`
   - Event source: "From form"
   - Select your Google Form
   - Event type: "On form submit"
4. Save the trigger

### Testing

1. Submit a test form response
2. Check the execution logs (View > Logs)
3. Verify the folder was created correctly
4. Check that files were renamed properly

## Troubleshooting

### Files Not Renamed Correctly

- Ensure `[TEMPLATE]` is spelled exactly as shown (uppercase, with square brackets)
- Check that special characters in the placeholder match the CONFIG setting

### Folder Not Created

- Verify the `DESTINATION_FOLDER_ID` has the correct permissions
- Ensure the script has authorization to access Google Drive
- Check the execution logs for error messages

### Template Not Copying

- Confirm the `TEMPLATE_FOLDER_ID` is correct
- Verify the script has read access to the template folder
- Check that the template folder isn't empty

## Permissions Required

This script requires the following Google permissions:
- **Google Drive**: Read template folder, write to destination folder
- **Google Forms**: Read form responses
- **Gmail**: Send confirmation emails

## Support

For detailed maintenance instructions, see [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md)

## Version History

- **v2.0** (2025-10-27): Refactored to use template folder copying with dynamic renaming
- **v1.0** (2021): Initial version with hardcoded file copying


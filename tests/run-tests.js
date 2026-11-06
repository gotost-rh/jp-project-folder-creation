#!/usr/bin/env node

/**
 * Local test runner for Google Apps Script code
 * This allows testing without pushing to Google Workspace
 */

const fs = require('fs');
const path = require('path');

// Load mocks
const { Logger, DriveApp, FormApp, MailApp, TestHelpers } = require('./mocks.js');

// Make mocks global so the script can use them
global.Logger = Logger;
global.DriveApp = DriveApp;
global.FormApp = FormApp;
global.MailApp = MailApp;

// Load the actual Code.js
const codeJsPath = path.join(__dirname, '..', 'Code.js');
const codeJs = fs.readFileSync(codeJsPath, 'utf8');

// Execute the code in this context (makes functions available)
eval(codeJs);

// Now we can access CONFIG and all functions
console.log('\n' + '='.repeat(80));
console.log('🧪 Running Local Mock Tests for Japan PM Tools');
console.log('='.repeat(80) + '\n');

let testsPassed = 0;
let testsFailed = 0;

/**
 * Test runner helper
 */
function runTest(testName, testFunction) {
  process.stdout.write(`\n▶️  ${testName}... `);
  
  try {
    TestHelpers.resetMocks();
    testFunction();
    console.log('✅ PASSED');
    testsPassed++;
  } catch (error) {
    console.log('❌ FAILED');
    console.error('   Error:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(1, 3).join('\n'));
    }
    testsFailed++;
  }
}

/**
 * Assertion helpers
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected "${expected}", got "${actual}"`);
  }
}

function assertContains(text, substring, message) {
  if (!text.includes(substring)) {
    throw new Error(message || `Expected "${text}" to contain "${substring}"`);
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

console.log('📋 Test Suite: Template Placeholder Replacement\n');

runTest('Test 1: Replace [TEMPLATE] with project name', () => {
  const result = replaceTemplatePlaceholder('[TEMPLATE] One Stop', 'JP-12345 Test Project');
  assertEqual(result, 'JP-12345 Test Project One Stop');
});

runTest('Test 2: Replace [TEMPLATE] with special characters around it', () => {
  const result = replaceTemplatePlaceholder('~[TEMPLATE] One Stop~', 'JP-12345 Test');
  assertEqual(result, '~JP-12345 Test One Stop~');
});

runTest('Test 3: Multiple [TEMPLATE] replacements', () => {
  const result = replaceTemplatePlaceholder('[TEMPLATE] - [TEMPLATE] Report', 'JP-001 ABC');
  assertEqual(result, 'JP-001 ABC - JP-001 ABC Report');
});

runTest('Test 4: No [TEMPLATE] in string', () => {
  const result = replaceTemplatePlaceholder('Regular File Name', 'JP-12345 Test');
  assertEqual(result, 'Regular File Name');
});

runTest('Test 5: Japanese characters in replacement', () => {
  const result = replaceTemplatePlaceholder('[TEMPLATE] Stakeholder', 'JP-001 テストプロジェクト');
  assertEqual(result, 'JP-001 テストプロジェクト Stakeholder');
});

runTest('Test 6: Special characters in project name', () => {
  const result = replaceTemplatePlaceholder('[TEMPLATE] Report', 'JP-001 Project & Co. (Test)');
  assertEqual(result, 'JP-001 Project & Co. (Test) Report');
});

console.log('\n📋 Test Suite: Folder Creation\n');

runTest('Test 7: Create new folder', () => {
  const { destFolder } = TestHelpers.setupMockFolderStructure('dest-123', 'template-456');
  
  const folderId = createFolder('dest-123', 'JP-12345 New Project');
  
  assert(folderId, 'Folder ID should be returned');
  const folder = TestHelpers.findFolderByName('JP-12345 New Project');
  assert(folder, 'Folder should exist');
  assertEqual(folder.getName(), 'JP-12345 New Project');
});

runTest('Test 8: Return existing folder if already exists', () => {
  const { destFolder } = TestHelpers.setupMockFolderStructure('dest-123', 'template-456');
  
  // Create folder first time
  const folderId1 = createFolder('dest-123', 'JP-12345 Existing Project');
  
  // Try to create same folder again
  const folderId2 = createFolder('dest-123', 'JP-12345 Existing Project');
  
  assertEqual(folderId1, folderId2, 'Should return same folder ID');
});

console.log('\n📋 Test Suite: Form Data Extraction\n');

runTest('Test 9: Extract form data correctly', () => {
  TestHelpers.addMockFormResponse('JP-12345', 'Test Project', 'test@example.com');
  
  const formData = getFormData();
  
  assertEqual(formData.opaId, 'JP-12345');
  assertEqual(formData.projectName, 'Test Project');
  assertEqual(formData.emailAddress, 'test@example.com');
  assertEqual(formData.folderName, 'JP-12345 Test Project');
});

runTest('Test 10: Handle special characters in form data', () => {
  TestHelpers.addMockFormResponse('JP-67890', 'Customer & Co. (テスト)', 'user@example.com');
  
  const formData = getFormData();
  
  assertEqual(formData.opaId, 'JP-67890');
  assertEqual(formData.projectName, 'Customer & Co. (テスト)');
  assertEqual(formData.folderName, 'JP-67890 Customer & Co. (テスト)');
});

console.log('\n📋 Test Suite: Folder Copying\n');

runTest('Test 11: Copy folder contents recursively', () => {
  const { destFolder, templateFolder } = TestHelpers.setupMockFolderStructure('dest-123', 'template-456');
  
  // Create destination folder for project
  const projectFolderId = createFolder('dest-123', 'JP-12345 Test Project');
  const projectFolder = DriveApp.getFolderById(projectFolderId);
  
  // Copy template contents
  copyFolderContents(templateFolder, projectFolder, 'JP-12345 Test Project');
  
  // Verify subfolders were created
  const pmFolder = TestHelpers.findFolderByName('99_PM');
  assert(pmFolder, '99_PM folder should be created');
  
  const preSalesFolder = TestHelpers.findFolderByName('00_提案資料');
  assert(preSalesFolder, '00_提案資料 folder should be created');
});

runTest('Test 12: Files are renamed during copy', () => {
  const { destFolder, templateFolder } = TestHelpers.setupMockFolderStructure('dest-123', 'template-456');
  
  const projectFolderId = createFolder('dest-123', 'JP-99999 ABC Project');
  const projectFolder = DriveApp.getFolderById(projectFolderId);
  
  copyFolderContents(templateFolder, projectFolder, 'JP-99999 ABC Project');
  
  // Check that [TEMPLATE] was replaced in file names
  const stakeholderFile = TestHelpers.findFileByName('JP-99999 ABC Project Stakeholder Register');
  assert(stakeholderFile, 'Stakeholder file should be renamed');
  
  const timesheetFile = TestHelpers.findFileByName('JP-99999 ABC Project Timesheet v20250930');
  assert(timesheetFile, 'Timesheet file should be renamed');
  
  const oneStopFile = TestHelpers.findFileByName('~JP-99999 ABC Project One Stop~');
  assert(oneStopFile, 'One Stop file should be renamed');
});

runTest('Test 13: Files without [TEMPLATE] are not renamed', () => {
  const { destFolder, templateFolder } = TestHelpers.setupMockFolderStructure('dest-123', 'template-456');
  
  const projectFolderId = createFolder('dest-123', 'JP-12345 Test');
  const projectFolder = DriveApp.getFolderById(projectFolderId);
  
  copyFolderContents(templateFolder, projectFolder, 'JP-12345 Test');
  
  // Check that file without [TEMPLATE] keeps original name
  const pmFile = TestHelpers.findFileByName('~ PM フォルダ内容 ~');
  assert(pmFile, 'PM folder contents file should keep original name');
});

console.log('\n📋 Test Suite: Email Sending\n');

runTest('Test 14: Send confirmation email', () => {
  const formData = {
    opaId: 'JP-12345',
    projectName: 'Test Project',
    emailAddress: 'user@example.com',
    folderName: 'JP-12345 Test Project'
  };
  
  const folderUrl = 'https://drive.google.com/drive/folders/mock-folder-123';
  
  sendConfirmationEmail(formData, folderUrl);
  
  const emails = TestHelpers.getSentEmails();
  assertEqual(emails.length, 1, 'Should send one email');
  assertEqual(emails[0].to, 'user@example.com');
  assertContains(emails[0].subject, 'JP-12345');
  assertContains(emails[0].subject, 'Test Project');
  assertContains(emails[0].body, folderUrl);
});

console.log('\n📋 Test Suite: End-to-End\n');

runTest('Test 15: Full workflow simulation', () => {
  // Setup
  TestHelpers.setupMockFolderStructure('dest-123', 'template-456');
  TestHelpers.addMockFormResponse('JP-00001', 'Full Test Project', 'fulltest@example.com');
  
  // Override CONFIG for test
  global.CONFIG = {
    DESTINATION_FOLDER_ID: 'dest-123',
    TEMPLATE_FOLDER_ID: 'template-456',
    TEMPLATE_PLACEHOLDER: '[TEMPLATE]'
  };
  
  // Simulate form submission
  const formData = getFormData();
  
  // Create project folder
  const projectFolderId = createFolder(CONFIG.DESTINATION_FOLDER_ID, formData.folderName);
  const projectFolderUrl = `https://drive.google.com/drive/folders/${projectFolderId}`;
  
  // Copy template
  const templateFolder = DriveApp.getFolderById(CONFIG.TEMPLATE_FOLDER_ID);
  const destinationFolder = DriveApp.getFolderById(projectFolderId);
  copyFolderContents(templateFolder, destinationFolder, formData.folderName);
  
  // Send email
  sendConfirmationEmail(formData, projectFolderUrl);
  
  // Verify everything
  const projectFolder = TestHelpers.findFolderByName('JP-00001 Full Test Project');
  assert(projectFolder, 'Project folder should be created');
  
  const renamedFile = TestHelpers.findFileByName('JP-00001 Full Test Project Stakeholder Register');
  assert(renamedFile, 'Files should be renamed');
  
  const emails = TestHelpers.getSentEmails();
  assertEqual(emails.length, 1, 'Confirmation email should be sent');
  assertEqual(emails[0].to, 'fulltest@example.com');
  
  console.log('\n   📊 Created folder structure:');
  TestHelpers.printFolderStructure(projectFolderId, '   ');
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 Test Results');
console.log('='.repeat(80));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total:  ${testsPassed + testsFailed}`);
console.log('='.repeat(80) + '\n');

// Exit with error code if any tests failed
process.exit(testsFailed > 0 ? 1 : 0);


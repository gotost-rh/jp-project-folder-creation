/**
 * Mock implementations of Google Apps Script services for local testing
 */

// Mock file system to simulate Google Drive
const mockFileSystem = {
  folders: {},
  files: {},
  nextId: 1000
};

/**
 * Mock Logger
 */
const Logger = {
  log: function(...args) {
    console.log('[Logger]', ...args);
  }
};

/**
 * Mock File class
 */
class MockFile {
  constructor(id, name, parentFolderId) {
    this.id = id;
    this.name = name;
    this.parentFolderId = parentFolderId;
  }

  getName() {
    return this.name;
  }

  getId() {
    return this.id;
  }

  makeCopy(newName, destinationFolder) {
    const newId = `file_${mockFileSystem.nextId++}`;
    const newFile = new MockFile(newId, newName, destinationFolder.getId());
    mockFileSystem.files[newId] = newFile;
    
    // Add to destination folder's files
    if (!destinationFolder.fileIds) {
      destinationFolder.fileIds = [];
    }
    destinationFolder.fileIds.push(newId);
    
    Logger.log(`Mock: Copied file "${this.name}" to "${newName}" in folder ${destinationFolder.getId()}`);
    return newFile;
  }
}

/**
 * Mock FileIterator
 */
class MockFileIterator {
  constructor(fileIds) {
    this.fileIds = fileIds || [];
    this.index = 0;
  }

  hasNext() {
    return this.index < this.fileIds.length;
  }

  next() {
    const fileId = this.fileIds[this.index++];
    return mockFileSystem.files[fileId];
  }
}

/**
 * Mock Folder class
 */
class MockFolder {
  constructor(id, name, parentFolderId = null) {
    this.id = id;
    this.name = name;
    this.parentFolderId = parentFolderId;
    this.subfolderIds = [];
    this.fileIds = [];
  }

  getName() {
    return this.name;
  }

  getId() {
    return this.id;
  }

  createFolder(folderName) {
    const newId = `folder_${mockFileSystem.nextId++}`;
    const newFolder = new MockFolder(newId, folderName, this.id);
    mockFileSystem.folders[newId] = newFolder;
    this.subfolderIds.push(newId);
    
    Logger.log(`Mock: Created folder "${folderName}" with ID ${newId}`);
    return newFolder;
  }

  getFolders() {
    return new MockFolderIterator(this.subfolderIds);
  }

  getFiles() {
    return new MockFileIterator(this.fileIds);
  }
}

/**
 * Mock FolderIterator
 */
class MockFolderIterator {
  constructor(folderIds) {
    this.folderIds = folderIds || [];
    this.index = 0;
  }

  hasNext() {
    return this.index < this.folderIds.length;
  }

  next() {
    const folderId = this.folderIds[this.index++];
    return mockFileSystem.folders[folderId];
  }
}

/**
 * Mock DriveApp
 */
const DriveApp = {
  getFolderById: function(folderId) {
    if (mockFileSystem.folders[folderId]) {
      return mockFileSystem.folders[folderId];
    }
    throw new Error(`Mock: Folder not found: ${folderId}`);
  },

  getFileById: function(fileId) {
    if (mockFileSystem.files[fileId]) {
      return mockFileSystem.files[fileId];
    }
    throw new Error(`Mock: File not found: ${fileId}`);
  }
};

/**
 * Mock FormApp Response
 */
class MockFormResponse {
  constructor(itemResponses, email) {
    this.itemResponses = itemResponses;
    this.email = email;
  }

  getItemResponses() {
    return this.itemResponses;
  }

  getRespondentEmail() {
    return this.email;
  }
}

/**
 * Mock FormApp ItemResponse
 */
class MockItemResponse {
  constructor(response) {
    this.response = response;
  }

  getResponse() {
    return this.response;
  }
}

/**
 * Mock FormApp
 */
const FormApp = {
  _responses: [],

  getActiveForm: function() {
    return {
      getResponses: () => FormApp._responses
    };
  },

  // Test helper to add mock response
  _addMockResponse: function(opaId, projectName, email) {
    const itemResponses = [
      new MockItemResponse(opaId),
      new MockItemResponse(projectName)
    ];
    const response = new MockFormResponse(itemResponses, email);
    FormApp._responses.push(response);
  },

  // Test helper to clear responses
  _clearResponses: function() {
    FormApp._responses = [];
  }
};

/**
 * Mock MailApp
 */
const MailApp = {
  sentEmails: [],

  sendEmail: function(options) {
    const email = {
      to: options.to,
      subject: options.subject,
      body: options.body,
      timestamp: new Date()
    };
    this.sentEmails.push(email);
    Logger.log(`Mock: Email sent to ${options.to}`);
    Logger.log(`  Subject: ${options.subject}`);
    Logger.log(`  Body: ${options.body}`);
    return email;
  },

  // Test helper to clear sent emails
  _clearSentEmails: function() {
    this.sentEmails = [];
  }
};

/**
 * Test helper functions
 */
const TestHelpers = {
  /**
   * Reset all mock data
   */
  resetMocks: function() {
    mockFileSystem.folders = {};
    mockFileSystem.files = {};
    mockFileSystem.nextId = 1000;
    FormApp._clearResponses();
    MailApp._clearSentEmails();
  },

  /**
   * Create a mock folder structure for testing
   */
  setupMockFolderStructure: function(destinationFolderId, templateFolderId) {
    // Create destination folder
    const destFolder = new MockFolder(destinationFolderId, 'Japan Private Repo');
    mockFileSystem.folders[destinationFolderId] = destFolder;

    // Create template folder with structure
    const templateFolder = new MockFolder(templateFolderId, '~Template Project~');
    mockFileSystem.folders[templateFolderId] = templateFolder;

    // Add subfolders to template
    const subfolders = [
      '00_提案資料',
      '01_作成資料',
      '02_受領資料',
      '03_会議資料',
      '99_PM'
    ];

    subfolders.forEach(folderName => {
      const subfolder = templateFolder.createFolder(folderName);
      
      // Add some mock files to subfolders
      if (folderName === '99_PM') {
        const fileId1 = `file_${mockFileSystem.nextId++}`;
        const file1 = new MockFile(fileId1, '[TEMPLATE] Stakeholder Register', subfolder.getId());
        mockFileSystem.files[fileId1] = file1;
        subfolder.fileIds.push(fileId1);

        const fileId2 = `file_${mockFileSystem.nextId++}`;
        const file2 = new MockFile(fileId2, '[TEMPLATE] Timesheet v20250930', subfolder.getId());
        mockFileSystem.files[fileId2] = file2;
        subfolder.fileIds.push(fileId2);

        const fileId3 = `file_${mockFileSystem.nextId++}`;
        const file3 = new MockFile(fileId3, '~ PM フォルダ内容 ~', subfolder.getId());
        mockFileSystem.files[fileId3] = file3;
        subfolder.fileIds.push(fileId3);
      }
    });

    // Add One Stop file to template root
    const oneStopId = `file_${mockFileSystem.nextId++}`;
    const oneStopFile = new MockFile(oneStopId, '~[TEMPLATE] One Stop~', templateFolderId);
    mockFileSystem.files[oneStopId] = oneStopFile;
    templateFolder.fileIds.push(oneStopId);

    return { destFolder, templateFolder };
  },

  /**
   * Add a mock form response
   */
  addMockFormResponse: function(opaId, projectName, email) {
    FormApp._addMockResponse(opaId, projectName, email);
  },

  /**
   * Get all created folders
   */
  getCreatedFolders: function() {
    return Object.values(mockFileSystem.folders);
  },

  /**
   * Get all created files
   */
  getCreatedFiles: function() {
    return Object.values(mockFileSystem.files);
  },

  /**
   * Find folder by name
   */
  findFolderByName: function(name) {
    return Object.values(mockFileSystem.folders).find(f => f.getName() === name);
  },

  /**
   * Find file by name
   */
  findFileByName: function(name) {
    return Object.values(mockFileSystem.files).find(f => f.getName() === name);
  },

  /**
   * Get sent emails
   */
  getSentEmails: function() {
    return MailApp.sentEmails;
  },

  /**
   * Print folder structure for debugging
   */
  printFolderStructure: function(folderId, indent = '') {
    const folder = mockFileSystem.folders[folderId];
    if (!folder) return;

    console.log(indent + '📁 ' + folder.getName());

    // Print files in this folder
    folder.fileIds.forEach(fileId => {
      const file = mockFileSystem.files[fileId];
      console.log(indent + '  📄 ' + file.getName());
    });

    // Print subfolders recursively
    folder.subfolderIds.forEach(subfolderId => {
      TestHelpers.printFolderStructure(subfolderId, indent + '  ');
    });
  }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Logger,
    DriveApp,
    FormApp,
    MailApp,
    TestHelpers
  };
}


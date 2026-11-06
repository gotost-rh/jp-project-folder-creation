/**
 * Japan Automatic Project Folder Creation
 *
 * Form trigger: create project folder under _NewProjects, copy template tree,
 * email submitter, post progress to a Google Chat space webhook.
 * Aborts if the folder name already exists in the Shared Drive.
 */

const GOOGLE_CHAT_WEBHOOK_PROPERTY = 'GOOGLE_CHAT_WEBHOOK_URL';

const CONFIG = {
  SHARED_DRIVE_ID: '0ANQ5Ex6IvvzsUk9PVA',
  DESTINATION_FOLDER_ID: '1B0dGTTnhuPbtJwdkxZznjns3FcSljRhZ', // _NewProjects
  TEMPLATE_FOLDER_ID: '1t9heIEB3EZI4IrZjlzk2C8lUT3I00W7e',
  TEMPLATE_PLACEHOLDER: '[TEMPLATE]',
  FORM_QUESTION_OPPORTUNITY_ID: 'Opportunity ID',
  FORM_QUESTION_PROJECT_NAME: 'Project Name',
  MAX_COPIED_FILE_NAME_LENGTH: 60,
  // Shortcuts are handled separately (resolve target, then copy the target file)
  UNSUPPORTED_MIME_TYPES: [
    'application/vnd.google-apps.site',
    'application/vnd.google-apps.form',
    'application/vnd.google-apps.map',
    'application/vnd.google-apps.jam'
  ],
  SHORTCUT_MIME_TYPE: 'application/vnd.google-apps.shortcut',
  /**
   * Rename overrides for template items that do not use [TEMPLATE] in Drive.
   * Key: exact source/shortcut name (or unique prefix). Value: name with [TEMPLATE].
   * Example result: "7213350 My Project S2D Checklist" (then truncated if needed).
   */
  COPY_NAME_OVERRIDES: {
    'APAC Sales to Delivery Checklist_v8.0': '[TEMPLATE] S2D Checklist'
  },
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000
};

/**
 * Form submit trigger entry point.
 * @param {Object} _event
 */
function onFormSubmit(_event) {
  Logger.log('Starting project folder creation process');
  var formData = null;
  var chatThread = null;

  try {
    formData = getFormData();
    logFormData(formData);

    chatThread = startChatProgressThread_(formData.folderName + '\n' + formData.emailAddress);

    var existing = findExistingProjectFolders(formData.folderName);
    if (existing.length > 0) {
      Logger.log('Duplicate folder found (' + existing.length + '); aborting creation');
      sendChatProgress_(
        '重複 — 中止\n対象: ' +
          formData.folderName +
          '\n依頼者: ' +
          formData.emailAddress +
          '\n' +
          formatExistingFolderUrls_(existing),
        chatThread
      );
      sendDuplicateEmail(formData, existing);
      return;
    }

    var projectFolderId = createFolder(CONFIG.DESTINATION_FOLDER_ID, formData.folderName);
    var projectFolderUrl = folderUrl(projectFolderId);
    var templateFolder = DriveApp.getFolderById(CONFIG.TEMPLATE_FOLDER_ID);
    var destinationFolder = DriveApp.getFolderById(projectFolderId);
    var copyPlan = listTemplateCopyPlan_(templateFolder, formData.folderName);

    sendChatProgress_(
      'フォルダ作成中\n' +
        projectFolderUrl +
        '\n\nコピー予定 ' +
        copyPlan.length +
        '件:\n' +
        formatCopyPlanForChat_(copyPlan) +
        '\n\nコピー開始',
      chatThread
    );

    copyFolderContents(templateFolder, destinationFolder, formData.folderName, chatThread, {
      index: 0,
      total: copyPlan.length
    });

    sendChatProgress_(
      '完了\n依頼者: ' + formData.emailAddress + '\nメール送信済\n' + projectFolderUrl,
      chatThread
    );
    sendConfirmationEmail(formData, projectFolderUrl);
    Logger.log('Project folder creation completed successfully');
  } catch (error) {
    Logger.log('Error in onFormSubmit: ' + error.message);
    if (formData) {
      sendChatProgress_(
        'エラー\n依頼者: ' + (formData.emailAddress || '(unknown)') + '\n' + error.message,
        chatThread
      );
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

/**
 * @returns {{opaId: string, projectName: string, emailAddress: string, folderName: string}}
 */
function getFormData() {
  var formResponses = FormApp.getActiveForm().getResponses();
  var lastResponse = formResponses[formResponses.length - 1];
  var answersByTitle = {};

  lastResponse.getItemResponses().forEach(function (itemResponse) {
    answersByTitle[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
  });

  var opaId = String(answersByTitle[CONFIG.FORM_QUESTION_OPPORTUNITY_ID] || '').trim();
  var projectName = String(answersByTitle[CONFIG.FORM_QUESTION_PROJECT_NAME] || '').trim();

  if (!opaId || !projectName) {
    throw new Error(
      'Missing required form answers. Expected "' +
        CONFIG.FORM_QUESTION_OPPORTUNITY_ID +
        '" and "' +
        CONFIG.FORM_QUESTION_PROJECT_NAME +
        '".'
    );
  }

  return {
    opaId: opaId,
    projectName: projectName,
    emailAddress: lastResponse.getRespondentEmail(),
    folderName: opaId + ' ' + projectName
  };
}

function logFormData(formData) {
  Logger.log('Opportunity ID: ' + formData.opaId);
  Logger.log('Project Name: ' + formData.projectName);
  Logger.log('Email: ' + formData.emailAddress);
  Logger.log('Folder Name: ' + formData.folderName);
}

// ---------------------------------------------------------------------------
// Drive
// ---------------------------------------------------------------------------

/**
 * @param {string} folderName
 * @returns {Array<{id: string, name: string, webViewLink?: string}>}
 */
function findExistingProjectFolders(folderName) {
  var escapedName = folderName.replace(/'/g, "\\'");
  var response = Drive.Files.list({
    q:
      "name='" +
      escapedName +
      "' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    corpora: 'drive',
    driveId: CONFIG.SHARED_DRIVE_ID,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    fields: 'files(id,name,webViewLink)',
    pageSize: 100
  });
  return (response && response.files) || [];
}

/**
 * @param {string} parentFolderId
 * @param {string} folderName
 * @returns {string}
 */
function createFolder(parentFolderId, folderName) {
  var parentFolder = DriveApp.getFolderById(parentFolderId);
  var subFolders = parentFolder.getFolders();

  while (subFolders.hasNext()) {
    var folder = subFolders.next();
    if (folder.getName() === folderName) {
      Logger.log('Folder "' + folderName + '" already exists under destination parent');
      return folder.getId();
    }
  }

  Logger.log('Creating new folder: "' + folderName + '"');
  return parentFolder.createFolder(folderName).getId();
}

/**
 * Apply COPY_NAME_OVERRIDES so items like the S2D checklist get a [TEMPLATE] name.
 * @param {string} sourceName
 * @returns {string}
 */
function applyCopyNameOverride_(sourceName) {
  var overrides = CONFIG.COPY_NAME_OVERRIDES || {};
  if (overrides[sourceName]) {
    return overrides[sourceName];
  }
  if (/APAC Sales to Delivery Checklist/i.test(sourceName)) {
    return '[TEMPLATE] S2D Checklist';
  }
  return sourceName;
}

/**
 * Resolve a template file (or shortcut) to the Drive file that should be copied.
 * Shortcuts cannot be makeCopy'd; we copy the target and rename via displayName.
 * @param {GoogleAppsScript.Drive.File} file
 * @returns {{sourceFile: GoogleAppsScript.Drive.File, displayName: string}|null}
 */
function resolveCopySource_(file) {
  var mimeType = file.getMimeType();
  if (CONFIG.UNSUPPORTED_MIME_TYPES.indexOf(mimeType) !== -1) {
    return null;
  }

  if (mimeType === MimeType.SHORTCUT || mimeType === CONFIG.SHORTCUT_MIME_TYPE) {
    try {
      var meta = Drive.Files.get(file.getId(), {
        supportsAllDrives: true,
        fields: 'name,shortcutDetails'
      });
      var targetId = meta.shortcutDetails && meta.shortcutDetails.targetId;
      if (!targetId) {
        Logger.log('Shortcut has no target: ' + file.getName());
        return null;
      }
      var shortcutName = file.getName() || meta.name;
      return {
        sourceFile: DriveApp.getFileById(targetId),
        displayName: applyCopyNameOverride_(shortcutName)
      };
    } catch (e) {
      Logger.log('Failed to resolve shortcut "' + file.getName() + '": ' + e.message);
      return null;
    }
  }

  return {
    sourceFile: file,
    displayName: applyCopyNameOverride_(file.getName())
  };
}

/**
 * @param {GoogleAppsScript.Drive.Folder} sourceFolder
 * @param {string} replacementText
 * @returns {string[]}
 */
function listTemplateCopyPlan_(sourceFolder, replacementText) {
  var names = [];

  function walk(folder) {
    var files = folder.getFiles();
    while (files.hasNext()) {
      var resolved = resolveCopySource_(files.next());
      if (!resolved) {
        continue;
      }
      names.push(
        truncateCopiedFileName(
          replaceTemplatePlaceholder(resolved.displayName, replacementText),
          replacementText
        )
      );
    }
    var subFolders = folder.getFolders();
    while (subFolders.hasNext()) {
      walk(subFolders.next());
    }
  }

  walk(sourceFolder);
  return names;
}

/**
 * @param {string[]} names
 * @returns {string}
 */
function formatCopyPlanForChat_(names) {
  if (!names || !names.length) {
    return '(なし)';
  }
  return names
    .map(function (name, index) {
      return String(index + 1) + '. ' + sanitizeChatFileName_(name);
    })
    .join('\n');
}

/** Strip template ~ decoration so Chat does not render strikethrough. */
function sanitizeChatFileName_(name) {
  return String(name || '')
    .replace(/^~+|~+$/g, '')
    .replace(/~/g, '-')
    .trim();
}

/**
 * @param {GoogleAppsScript.Drive.Folder} sourceFolder
 * @param {GoogleAppsScript.Drive.Folder} destinationFolder
 * @param {string} replacementText
 * @param {{name: string}|null=} chatThread
 * @param {{index: number, total: number}=} copyCounter
 */
function copyFolderContents(sourceFolder, destinationFolder, replacementText, chatThread, copyCounter) {
  Logger.log(
    'Copying contents from "' + sourceFolder.getName() + '" to "' + destinationFolder.getName() + '"'
  );

  if (!copyCounter) {
    copyCounter = { index: 0, total: 0 };
  }

  var files = sourceFolder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var resolved = resolveCopySource_(file);
    if (!resolved) {
      Logger.log('SKIPPING unsupported/unresolvable: ' + file.getName() + ' [' + file.getMimeType() + ']');
      continue;
    }

    var newFileName = truncateCopiedFileName(
      replaceTemplatePlaceholder(resolved.displayName, replacementText),
      replacementText
    );
    var displayName = sanitizeChatFileName_(newFileName);
    copyCounter.index += 1;
    var label = 'ファイル' + copyCounter.index + (copyCounter.total ? '/' + copyCounter.total : '');

    sendChatProgress_(label + ' コピー開始: ' + displayName, chatThread);
    // Copy the resolved source (shortcut target), not the shortcut itself
    if (copyFileWithRetry(resolved.sourceFile, newFileName, destinationFolder)) {
      sendChatProgress_(label + ' 完了: ' + displayName, chatThread);
    } else {
      sendChatProgress_(label + ' 失敗: ' + displayName, chatThread);
    }
  }

  var subFolders = sourceFolder.getFolders();
  while (subFolders.hasNext()) {
    var subFolder = subFolders.next();
    try {
      Utilities.sleep(CONFIG.BASE_DELAY_MS);
      Logger.log('Creating subfolder: "' + subFolder.getName() + '"');
      copyFolderContents(
        subFolder,
        destinationFolder.createFolder(subFolder.getName()),
        replacementText,
        chatThread,
        copyCounter
      );
    } catch (e) {
      Logger.log('ERROR creating subfolder "' + subFolder.getName() + '": ' + e.message);
    }
  }
}

/**
 * @param {GoogleAppsScript.Drive.File} file
 * @param {string} newFileName
 * @param {GoogleAppsScript.Drive.Folder} destinationFolder
 * @returns {boolean}
 */
function copyFileWithRetry(file, newFileName, destinationFolder) {
  var attempt = 0;
  while (attempt < CONFIG.MAX_RETRIES) {
    try {
      Utilities.sleep(CONFIG.BASE_DELAY_MS * (attempt + 1));
      file.makeCopy(newFileName, destinationFolder);
      Logger.log('Successfully copied: ' + newFileName);
      return true;
    } catch (e) {
      attempt++;
      if (attempt >= CONFIG.MAX_RETRIES) {
        Logger.log(
          'ERROR copying file "' + file.getName() + '" after ' + CONFIG.MAX_RETRIES + ' attempts: ' + e.message
        );
      } else {
        Logger.log(
          'Drive hiccup on "' + file.getName() + '". Retrying (' + (attempt + 1) + '/' + CONFIG.MAX_RETRIES + ')...'
        );
      }
    }
  }
  return false;
}

function replaceTemplatePlaceholder(text, replacementText) {
  var escapedPlaceholder = CONFIG.TEMPLATE_PLACEHOLDER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escapedPlaceholder, 'g'), replacementText);
}

/**
 * Prefer keeping the doc-type suffix; shorten the project prefix to fit max length.
 * @param {string} fileName
 * @param {string} replacementText
 * @returns {string}
 */
function truncateCopiedFileName(fileName, replacementText) {
  var maxLen = CONFIG.MAX_COPIED_FILE_NAME_LENGTH;
  if (!fileName || fileName.length <= maxLen) {
    return fileName;
  }

  var idx = fileName.indexOf(replacementText);
  if (idx === -1) {
    return fileName.substring(0, maxLen);
  }

  var prefix = fileName.substring(0, idx);
  var suffix = fileName.substring(idx + replacementText.length);
  var budget = maxLen - prefix.length - suffix.length;
  if (budget <= 0) {
    return fileName.substring(0, maxLen);
  }

  var shortenedProject = replacementText.substring(0, budget);
  if (shortenedProject.length < replacementText.length) {
    var cut = Math.max(
      shortenedProject.lastIndexOf(' '),
      shortenedProject.lastIndexOf('_'),
      shortenedProject.lastIndexOf('-')
    );
    if (cut >= Math.floor(budget * 0.5)) {
      shortenedProject = shortenedProject.substring(0, cut);
    }
  }
  return prefix + shortenedProject + suffix;
}

// ---------------------------------------------------------------------------
// Google Chat webhook
// ---------------------------------------------------------------------------

/**
 * Save webhook URL to Script Properties.
 * Or set GOOGLE_CHAT_WEBHOOK_URL in Project Settings, then run testGoogleChatWebhook().
 * @param {string} url
 * @returns {boolean}
 */
function setupGoogleChatWebhook(url) {
  var trimmed = String(url || '').trim();
  if (!trimmed) {
    throw new Error(
      'Pass webhook URL, or set GOOGLE_CHAT_WEBHOOK_URL in Script properties and run testGoogleChatWebhook().'
    );
  }
  if (trimmed.indexOf('https://chat.googleapis.com/') !== 0) {
    throw new Error('Invalid webhook URL (expected https://chat.googleapis.com/…)');
  }
  PropertiesService.getScriptProperties().setProperty(GOOGLE_CHAT_WEBHOOK_PROPERTY, trimmed);
  Logger.log(GOOGLE_CHAT_WEBHOOK_PROPERTY + ' saved');
  return true;
}

function getGoogleChatWebhookUrl_() {
  return PropertiesService.getScriptProperties().getProperty(GOOGLE_CHAT_WEBHOOK_PROPERTY);
}

/** Manual smoke test: parent + one reply. */
function testGoogleChatWebhook() {
  if (!getGoogleChatWebhookUrl_()) {
    throw new Error(GOOGLE_CHAT_WEBHOOK_PROPERTY + ' not set');
  }
  var thread = startChatProgressThread_('TEST\nwebhook');
  sendChatProgress_('TEST reply (~tilde~ check)', thread);
  return thread;
}

function buildGoogleChatWebhookUrl_(replyInThread) {
  var base = getGoogleChatWebhookUrl_();
  if (!base) {
    return null;
  }
  if (!replyInThread) {
    return base;
  }
  return base + (base.indexOf('?') >= 0 ? '&' : '?') + 'messageReplyOption=REPLY_MESSAGE_OR_FAIL';
}

/**
 * @param {string} text
 * @returns {{name: string}|null}
 */
function startChatProgressThread_(text) {
  var response = postGoogleChatWebhook_(text, null);
  if (response && response.thread && response.thread.name) {
    Logger.log('Chat thread: ' + response.thread.name);
    return { name: response.thread.name };
  }
  Logger.log('Chat parent missing thread.name: ' + JSON.stringify(response || {}));
  return null;
}

function sendChatProgress_(text, thread) {
  if (!text) {
    return;
  }
  postGoogleChatWebhook_(text, thread || null);
}

/**
 * @param {string} text
 * @param {{name: string}|null} thread
 * @returns {Object|null}
 */
function postGoogleChatWebhook_(text, thread) {
  try {
    var replyInThread = !!(thread && thread.name);
    var url = buildGoogleChatWebhookUrl_(replyInThread);
    if (!url) {
      Logger.log('Chat skipped: ' + GOOGLE_CHAT_WEBHOOK_PROPERTY + ' not set');
      return null;
    }

    var payload = { text: String(text).replace(/~/g, '-') };
    if (replyInThread) {
      payload.thread = { name: thread.name };
    }

    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    });

    var code = response.getResponseCode();
    var bodyText = response.getContentText();
    if (code < 200 || code >= 300) {
      throw new Error('HTTP ' + code + ': ' + bodyText);
    }
    if (!bodyText) {
      return {};
    }
    try {
      return JSON.parse(bodyText);
    } catch (parseErr) {
      return { raw: bodyText };
    }
  } catch (e) {
    Logger.log('Chat webhook failed: ' + e.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

function folderUrl(folderId) {
  return 'https://drive.google.com/drive/folders/' + folderId;
}

function formatExistingFolderUrls_(existingFolders) {
  return existingFolders
    .map(function (folder) {
      return '- ' + (folder.webViewLink || folderUrl(folder.id));
    })
    .join('\n');
}

function formatExistingFolderUrlsHtml_(existingFolders) {
  return existingFolders
    .map(function (folder) {
      var url = folder.webViewLink || folderUrl(folder.id);
      return '<li><a href="' + url + '">' + url + '</a></li>';
    })
    .join('');
}

function sendHtmlEmail_(to, subject, plainBody, htmlBody) {
  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });
}

function sendConfirmationEmail(formData, createdFolderUrl) {
  Logger.log('Sending confirmation email');
  sendHtmlEmail_(
    formData.emailAddress,
    formData.folderName + ' のプロジェクトフォルダを作成しました',
    'プロジェクトフォルダを作成しました。\n\n' +
      'フォルダの場所:\n' +
      createdFolderUrl +
      '\n\n' +
      '【お願い】\n' +
      '作成されたフォルダを Shared Drive 内の該当するAccountフォルダへ移動してください。\n' +
      '現在は「_NewProjects」配下に作成されています。',
    '<p>プロジェクトフォルダを作成しました。</p>' +
      '<p>フォルダの場所:<br><a href="' +
      createdFolderUrl +
      '">' +
      createdFolderUrl +
      '</a></p>' +
      '<p><strong>【お願い】</strong><br>' +
      '作成されたフォルダを Shared Drive 内の該当するAccountフォルダへ移動してください。<br>' +
      '現在は「_NewProjects」配下に作成されています。</p>'
  );
}

function sendDuplicateEmail(formData, existingFolders) {
  Logger.log('Sending duplicate-folder email');
  sendHtmlEmail_(
    formData.emailAddress,
    formData.folderName + ' のプロジェクトフォルダは既に存在します',
    '「' +
      formData.folderName +
      '」という名前のプロジェクトフォルダは、Shared Drive 内に既に存在します。\n\n' +
      '既存フォルダの場所:\n' +
      formatExistingFolderUrls_(existingFolders) +
      '\n\n' +
      '新しいフォルダは作成されていません。',
    '<p>「' +
      formData.folderName +
      '」という名前のプロジェクトフォルダは、Shared Drive 内に既に存在します。</p>' +
      '<p>既存フォルダの場所:</p><ul>' +
      formatExistingFolderUrlsHtml_(existingFolders) +
      '</ul>' +
      '<p>新しいフォルダは作成されていません。</p>'
  );
}

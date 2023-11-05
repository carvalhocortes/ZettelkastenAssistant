module.exports = {
  dateFormats: {
    dateFormat: 'YYYY-MM-DD',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss'
  },
  user: {
    passwordPolicy: {
      size: 6
    },
    maxWrongLoginAttempts: 5,
    status: {
      active: 'Active',
      locked: 'Locked',
      pending: 'Pending',
      deleted: 'Deleted'
    },
    permissions: {
      user: 'user',
      admin: 'administrator'
    }
  },
  acceptedDocumentTypes: [
    'pdf',
    'doc',
    'docx',
    'txt'
  ],
  file: {
    defaultSignedUrlExpirationInSeconds: 60 * 60,
    status: {
      pending: 'pending',
      analyzed: 'analyzed'
    }
  }
}

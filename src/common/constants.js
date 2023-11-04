module.exports = {
  buckets: [
    'files',
    'avatar'
  ],
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
  defaultSignedUrlExpirationInSeconds: 60 * 60
}

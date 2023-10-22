module.exports = {
  dateFormats: {
    dateFormat: 'YYYY-MM-DD',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss'
  },
  user: {
    status: {
      active: 'Active',
      locked: 'Locked',
      pending: 'Pending',
      deleted: 'Deleted'
    },
    subscriptions: {
      pro: 'Premium',
      regular: 'Regular'
    },
    Permissions: {
      basic: [
        'changeAccountData',
        'deleteAccount'
      ],
      admin: [
        'createNewUser',
        'changeUserData',
        'deleteUser'
      ]
    }

  },
  acceptedDocumentTypes: [
    'pdf',
    'doc',
    'docx',
    'txt'
  ],
}

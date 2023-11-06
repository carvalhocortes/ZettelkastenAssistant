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
  scheduledProcessAfter: {
    docalysis: 'processDocalysis',
    mendeley: 'processMendeley'
  },
  file: {
    defaultSignedUrlExpirationInSeconds: 60 * 60,
    status: {
      pending: 'pending',
      analyzed: 'analyzed',
      error: 'error'
    },
    mendeley: {
      types: {
        journal: 'journal',
        book: 'book',
        generic: 'generic',
        book_section: 'book_section',
        conference_proceedings: 'conference_proceedings',
        working_paper: 'working_paper',
        report: 'report',
        web_page: 'web_page',
        thesis: 'thesis',
        magazine_article: 'magazine_article',
        statute: 'statute',
        patent: 'patent',
        newspaper_article: 'newspaper_article',
        computer_program: 'computer_program',
        hearing: 'hearing',
        television_broadcast: 'television_broadcast',
        encyclopedia_article: 'encyclopedia_article',
        case: 'case',
        film: 'film',
        bill: 'bill'
      }
    }
  }
}

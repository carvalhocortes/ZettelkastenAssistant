module.exports = {
  dateFormats: {
    dateFormat: 'yyyy-MM-dd',
    dateTimeFormat: 'yyyy-MM-dd HH:mm:ss'
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
  acceptedFilesTypes: [
    'pdf',
    'doc',
    'docx',
    'txt'
  ],
  scheduledProcess: {
    getNewStatus: 'getNewStatus',
    askDocalysis: 'askDocalysis',
    updateMendeley: 'updateMendeley'
  },
  docalysis: {
    answerInJson: 'Using JSON notation, answer the following questions: '
  },
  file: {
    defaultSignedUrlExpirationInSeconds: 60 * 60,
    status: {
      created: 'pending answer',
      pendingAnswer: 'pending answer',
      pendingAnalysis: 'pending analysis',
      analyzed: 'analyzed',
      error: 'error'
    },
    types: {
      bill: 'bill',
      book: 'book',
      book_section: 'book_section',
      case: 'case',
      computer_program: 'computer_program',
      conference_proceedings: 'conference_proceedings',
      encyclopedia_article: 'encyclopedia_article',
      film: 'film',
      generic: 'generic',
      hearing: 'hearing',
      journal: 'journal',
      magazine_article: 'magazine_article',
      newspaper_article: 'newspaper_article',
      patent: 'patent',
      report: 'report',
      statute: 'statute',
      television_broadcast: 'television_broadcast',
      thesis: 'thesis',
      web_page: 'web_page',
      working_paper: 'working_paper'
    }
  }
}

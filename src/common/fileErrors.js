const errorCode = c => 3000 + c

module.exports = {
  bucketInexistent: {
    httpCode: 400,
    code: errorCode(1),
    msg: `The bucket is not available.`
  },
  commandIsNotValid: {
    httpCode: 400,
    code: errorCode(2),
    msg: `The requested command is not valid.`
  },
  docalysisError: {
    httpCode: 400,
    code: errorCode(3),
    msg: 'Unknown error on Docalysis'
  },
  fileTypeNotSupported: {
    httpCode: 400,
    code: errorCode(4),
    msg: 'The file type is not supported'
  },
  documentTypeNotSupported: {
    httpCode: 400,
    code: errorCode(5),
    msg: 'The given document type is not supported'
  },
  mendeleyError: {
    httpCode: 400,
    code: errorCode(6),
    msg: 'Unknown error on Mendeley'
  },
}

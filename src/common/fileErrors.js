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
}

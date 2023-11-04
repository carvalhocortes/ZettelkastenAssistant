const errorCode = c => 0 + c

module.exports = {
  bucketInexistent: {
    httpCode: 400,
    code: errorCode(1),
    msg: `The bucket is not available.`
  },
}

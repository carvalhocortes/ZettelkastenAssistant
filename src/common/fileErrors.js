const errorCode = c => 3000 + c

module.exports = {
  bucketInexistent: {
    httpCode: 400,
    code: errorCode(1),
    msg: `The bucket is not available.`
  },
}

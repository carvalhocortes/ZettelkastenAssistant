'use strict'

const aws = require('aws-sdk')
const s3 = new aws.S3()

const { defaultSignedUrlExpirationInSeconds } = require('../common/constants')
const fileErrors = require('../common/fileErrors')

const downloadFile = (bucketName, fileName) =>
  s3.getObject({ Bucket: bucketName, Key: fileName }).promise()
    .then(res => res.Body.toString('utf-8'))

const createPreSignedUrl = async ({ body: { fileName, bucketName, command }, session: { email } }) => {
  const params = {
    Bucket: getS3BucketName(bucketName),
    Key: `${email}/${fileName}`,
    Expires: defaultSignedUrlExpirationInSeconds
  }
  return { url: await s3.getSignedUrlPromise(getS3CommandName(command), params) }
}

// PRIVATE FUNCTIONS

const getS3BucketName = (bucketName) => {
  switch (bucketName) {
    case 'files':
      return process.env.FILES_BUCKET
    case 'avatar':
      return process.env.USER_AVATAR_BUCKET
    default:
      throw fileErrors.bucketInexistent
  }
}

const getS3CommandName = (command) => {
  switch (command) {
    case 'get':
      return 'getObject'
    case 'put':
      return 'putObject'
    case 'delete':
      return 'deleteObject'
    default:
      throw fileErrors.commandIsNotValid
  }
}

module.exports = {
  downloadFile,
  createPreSignedUrl
}

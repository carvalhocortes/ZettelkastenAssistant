'use strict'

const aws = require('aws-sdk')
const s3 = new aws.S3()

const { defaultSignedUrlExpirationInSeconds } = require('../common/constants')
const fileErrors = require('../common/fileErrors')

const downloadFile = (bucketName, fileName) =>
  s3.getObject({ Bucket: bucketName, Key: fileName }).promise()
    .then(res => res.Body.toString('utf-8'))

const createPreSignedUrl = async ({ body: { fileName, bucketName }, session: { email } }) => {
  const s3BucketName = getS3BucketName(bucketName)
  const params = {
    Bucket: s3BucketName,
    Key: `${email}/${fileName}`,
    Expires: defaultSignedUrlExpirationInSeconds
  }
  return { url: await s3.getSignedUrlPromise('putObject', params) }
}

// PRIVATE FUNCTIONS

const getS3BucketName = (bucketName) => {
  switch (bucketName) {
    case 'files':
      return process.env.FILES_BUCKET
    case 'avatar':
      return process.env.USER_AVATAR_BUCKET
    default:
      throw fileErrors .bucketInexistent
  }
}

module.exports = {
  downloadFile,
  createPreSignedUrl
}

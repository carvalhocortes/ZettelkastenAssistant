'use strict'

const aws = require('aws-sdk')
const s3 = new aws.S3()

const { defaultSignedUrlExpirationInSeconds } = require('../common/constants')

const downloadFile = (bucketName, fileKey) =>
  s3.getObject({ Bucket: bucketName, Key: fileKey }).promise()
    .then(res => res.Body.toString('utf-8'))

const createPreSignedUrl = (fileKey, bucketName, user) => {
  const params = {
    Bucket: bucketName,
    Key: `${user}/${fileKey}`,
    Expires: defaultSignedUrlExpirationInSeconds
  }
  return s3.getSignedUrlPromise('getObject', params)
}

module.exports = {
  downloadFile,
  createPreSignedUrl
}

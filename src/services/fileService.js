'use strict'

const aws = require('aws-sdk')
const s3 = new aws.S3()

const constants = require('../common/constants')
const fileErrors = require('../common/fileErrors')
const docalysisConnector = require('../connector/docalysisConnector')
const mendeleyConnector = require('../connector/mendeleyConnector')


// const downloadFile = (bucketName, fileKey) =>
//   s3.getObject({ Bucket: bucketName, Key: fileKey }).promise()
//     .then(res => res.Body.toString('utf-8'))

const createPreSignedUrl = async (fileName, bucketName, command, email) => {
  const params = {
    Bucket: getS3BucketName(bucketName),
    Key: `${email}/${fileName}`,
    Expires: constants.file.defaultSignedUrlExpirationInSeconds
  }
  return { url: await s3.getSignedUrlPromise(getS3CommandName(command), params) }
}

const handleReceivedFile = async (event) => {
  const { bucketName, fileName, user } = parseS3Event(event)
  const url = createPreSignedUrl(bucketName, fileName, 'get', user)
  const docalysisResponse = await docalysisConnector.sentFileToDocalysis(fileName, url, user)
  const mendeleyResponse = await mendeleyConnector.sentFileToMendeley()
  await sentFileToDocalysis(fileName, url, user)
  const analysis = {
    user,
    fileName,
    checkStatusAfter,
    docalysisData: docalysisResponse.file,
    mendeleyData: mendeleyResponse,
    status: constants.file.status.pending
  }
  await filesDb.saveRequestedAnalysis(analysis, user)
  return
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

const parseS3Event = (event) => {
  const s3Event = event.Records[0].s3
  const bucketName = s3Event.bucket.name
  const [user, fileName] = decodeURIComponent(eventoS3.object.key.replace(/\+/g, ' ')).split('/')
  return { bucketName, fileName, user }
}

module.exports = {
  // downloadFile,
  createPreSignedUrl,
  handleReceivedFile
}

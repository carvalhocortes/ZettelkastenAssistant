'use strict'

const aws = require('aws-sdk')
const s3 = new aws.S3()

const constants = require('../common/constants')
const fileErrors = require('../common/fileErrors')
const docalysisConnector = require('../connector/docalysisConnector')
// const mendeleyConnector = require('../connector/mendeleyConnector')
const filesDb = require('../db/fileDb')
const { afterMinutes } = require('../helper/timeHelper')

const token = 'am6nebzgtlehx8382jw6xxyaghf2i3qc'

// const downloadFile = (bucketName, fileKey) =>
//   s3.getObject({ Bucket: bucketName, Key: fileKey }).promise()
//     .then(res => res.Body.toString('utf-8'))

const createPreSignedUrl = async (fileName, bucketName, command, username) => {
  const params = {
    Bucket: getS3BucketName(bucketName),
    Key: `${username}/${fileName}`,
    Expires: constants.file.defaultSignedUrlExpirationInSeconds
  }
  return { url: await s3.getSignedUrlPromise(getS3CommandName(command), params) }
}

const handleReceivedFile = async (event) => {
  const { fileName, username } = parseS3Event(event)
  const { url } = await createPreSignedUrl(fileName, 'files', 'get', username)
  const docalysisResponse = await docalysisConnector.sentFileToDocalysis(fileName, url, getDocalysisToken(username)) //
    .catch (async (error) => handlePartnerError(error, username, fileName, 'docalysis'))
  // const mendeleyResponse = await mendeleyConnector.sentFileToMendeley()
  //   .catch (async (error) => handlePartnerError(error, user, fileName, 'mendeley'))
  const scheduledProcessAfter = afterMinutes(5)
  const scheduledProcessFunction = constants.scheduledProcessAfter.docalysis
  const status = constants.file.status.pending
  const fileData = assembleFileData({ username, fileName, scheduledProcessAfter, scheduledProcessFunction, docalysisResponse, status })
  return filesDb.save(fileData)
}

// PRIVATE FUNCTIONS

const handlePartnerError = async (error, username, fileName, partner) => {
  const status = constants.file.status.error
  const fileData = assembleFileData({ username, fileName, status })
  fileData.errorLocation = partner
  await filesDb.save(fileData)
  throw error
}

const assembleFileData = ({ username, fileName, scheduledProcessAfter, scheduledProcessFunction, docalysisResponse, mendeleyResponse, status }) => ({
  username,
  fileName,
  scheduledProcessAfter,
  scheduledProcessFunction,
  docalysisData: docalysisResponse?.file,
  mendeleyData: mendeleyResponse,
  status
})

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
  const [username, fileName] = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' ')).split('/')
  return { fileName, username }
}

const getDocalysisToken = (username) => {
  return token
}

module.exports = {
  // downloadFile,
  createPreSignedUrl,
  handleReceivedFile
}

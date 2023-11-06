'use strict'

const aws = require('aws-sdk')
const s3 = new aws.S3()

const constants = require('../common/constants')
const fileErrors = require('../common/fileErrors')
const docalysisConnector = require('../connector/docalysisConnector')
// const mendeleyConnector = require('../connector/mendeleyConnector')
const fileDb = require('../db/fileDb')
const { afterMinutes, now, makeMoment } = require('../helper/timeHelper')
const { generateScheduledProcess } = require('../helper/scheduledProcessHelper')

const token = 'am6nebzgtlehx8382jw6xxyaghf2i3qc'

// const downloadFile = (bucketName, fileKey) =>
//   s3.getObject({ Bucket: bucketName, Key: fileKey }).promise()
//     .then(res => res.Body.toString('utf-8'))

const scheduledProcess = async (dateString) => {
  const date = dateString ? makeMoment(dateString) : now()
  const checkAndUpdateStatusFn = await generateScheduledProcess(constants.scheduledProcess.getNewStatus, fileDb, { handler: checkAndUpdateStatus })
  return Promise.all([
    checkAndUpdateStatusFn(date),
  ])
}

const createPreSignedUrl = async (fileName, bucketName, command, owner) => {
  const params = {
    Bucket: getS3BucketName(bucketName),
    Key: `${owner}/${fileName}`,
    Expires: constants.file.defaultSignedUrlExpirationInSeconds
  }
  return { url: await s3.getSignedUrlPromise(getS3CommandName(command), params) }
}

const handleReceivedFile = async (event) => {
  const { fileName, owner } = parseS3Event(event)
  const { url } = await createPreSignedUrl(fileName, 'files', 'get', owner)
  const file = await fileDb.save(assembleFileData({ owner, fileName, status: constants.file.status.created }))
  const docalysisResponse = await docalysisConnector.sentFileToDocalysis(fileName, url, getDocalysisToken(owner))
    .catch (async (error) => handlePartnerError(error, file, 'sending file to Docalysis'))
  // const mendeleyResponse = await mendeleyConnector.sentFileToMendeley()
  //   .catch (async (error) => handlePartnerError(error, user, fileName, 'mendeley'))
  const fileUpdateFields = {
    docalysisData: docalysisResponse.file,
    scheduledProcessName: constants.scheduledProcess.getNewStatus,
    scheduledProcessAfter: afterMinutes(5),
    status: constants.file.status.pendingAnswer
  }
  return fileDb.update(fileUpdateFields, file.id)
}

// PRIVATE FUNCTIONS

const handlePartnerError = async (error, file, errorLocation) => {
  const fileUpdateFields = {
    status: constants.file.status.error,
    errorLocation: errorLocation
  }
  await fileDb.update(fileUpdateFields, file.id)
  throw error
}

const assembleFileData = ({ owner, fileName, scheduledProcessAfter, scheduledProcessName, docalysisData, mendeleyResponse, status }) => ({
  owner,
  fileName,
  scheduledProcessAfter,
  scheduledProcessName,
  docalysisData,
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
  const [owner, fileName] = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' ')).split('/')
  return { fileName, owner }
}

const getDocalysisToken = (owner) => {
  return token
}

const checkAndUpdateStatus = async (file) => {
  const token = getDocalysisToken(file.owner)
  const docalysisResponse = await docalysisConnector.getFileData(file.docalysisData.id, token)
    .catch (async (error) => handlePartnerError(error, file, 'getting file info on Docalysis'))
  if (docalysisResponse.file.processed_state !== 'processed') return file
  const fileUpdateFields = {
    docalysisData: docalysisResponse.file,
    scheduledProcessName: constants.scheduledProcess.askDocalysis,
    scheduledProcessAfter: afterMinutes(5),
    status: constants.file.status.pendingAnswer
  }
  return fileDb.update(fileUpdateFields, file.id, ['errorLocation'])
}

module.exports = {
  // downloadFile,
  createPreSignedUrl,
  handleReceivedFile,
  scheduledProcess
}

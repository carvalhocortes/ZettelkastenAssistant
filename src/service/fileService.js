'use strict'

const aws = require('aws-sdk')
const s3 = new aws.S3({ region: process.env.REGION })

const constants = require('../common/constants')
const questions = require('../common/questions')
const fileErrors = require('../common/fileErrors')
const docalysisConnector = require('../connector/docalysisConnector')
// const mendeleyConnector = require('../connector/mendeleyConnector')
const fileDb = require('../db/fileDb')
const { afterMinutes, now, makeMoment } = require('../helper/timeHelper')
const { generateScheduledProcess } = require('../helper/scheduledProcessHelper')

// const downloadFile = (bucketName, fileKey) =>
//   s3.getObject({ Bucket: bucketName, Key: fileKey }).promise()
//     .then(res => res.Body.toString('utf-8'))

const scheduledProcess = async (dateString) => {
  const date = dateString ? makeMoment(dateString) : now()
  const checkAndUpdateDocalysisStatusFn = await generateScheduledProcess(constants.scheduledProcess.getNewStatus, fileDb, { handler: checkAndUpdateDocalysisStatus })
  const askDocalysisStatusFn = await generateScheduledProcess(constants.scheduledProcess.askDocalysis, fileDb, { handler: askDocalysisStatus })
  return Promise.all([
    checkAndUpdateDocalysisStatusFn(date),
    askDocalysisStatusFn(date)
  ])
}

const createPreSignedUrl = async ({ fileName, type }, bucketName, command, owner ) => {
  const receivedFileExtension = (fileName.match(/\.([^.]+)$/))[1]
  if (!constants.acceptedFilesTypes.includes(receivedFileExtension)) throw fileErrors.fileTypeNotSupported
  const params = {
    Bucket: getS3BucketName(bucketName),
    Key: `${owner}/${fileName}`,
    Expires: constants.file.defaultSignedUrlExpirationInSeconds,
  }
  if (type && command === 'put') {
    if (!Object.values(questions).includes(type)) throw fileErrors.documentTypeNotSupported
    params.Metadata = { type }
  }

  return { url: await s3.getSignedUrlPromise(getS3CommandName(command), params) }
}

const handleReceivedFile = async (event) => {
  const { fileKey, fileName, bucket, owner } = parseS3Event(event)
  const { url } = await createPreSignedUrl({ fileName }, 'files', 'get', owner)
  // const bucket = 'zettelkasten-files-dev'
  // const fileKey = 'fernando@zettelkastenassistant.com/default.png'
  const { Metadata } = await s3.getObject({ Bucket: bucket, Key: fileKey}).promise()
  const file = await fileDb.save({ owner, type: Metadata?.type, fileName, status: constants.file.status.created })
  const docalysisResponse = await docalysisConnector.sentFileToDocalysis(fileName, url)
    .catch (async (error) => handlePartnerError(error, file.id, 'sending file to Docalysis'))
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

const handlePartnerError = async (error, fileId, errorLocation) => {
  const fileUpdateFields = {
    status: constants.file.status.error,
    error,
    errorLocation
  }
  await fileDb.update(fileUpdateFields, fileId)
  throw error
}

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
  const fileKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '))
  const bucket = event.Records[0].s3.bucket.name
  const [owner, fileName] = fileKey.split('/')
  return { fileKey, fileName, owner, bucket }
}

const checkAndUpdateDocalysisStatus = async (file) => {
  const docalysisResponse = await docalysisConnector.getFileData(file.docalysisData.id)
    .catch (async (error) => handlePartnerError(error, file.id, 'getting file info on Docalysis'))
  if (docalysisResponse.file.processed_state !== 'processed') return file
  const fileUpdateFields = {
    docalysisData: docalysisResponse.file,
    scheduledProcessName: constants.scheduledProcess.askDocalysis,
    scheduledProcessAfter: afterMinutes(5),
    status: constants.file.status.pendingAnswer
  }
  return fileDb.update(fileUpdateFields, file.id, ['errorLocation', 'error'])
}

const askDocalysisStatus = async (file) => {
  const question = questions[file.type]
  const data = `${prompt}${question}`
  const answer = docalysisConnector.askToFile(file.docalysisData.id, data)
}

module.exports = {
  // downloadFile,
  createPreSignedUrl,
  handleReceivedFile,
  scheduledProcess
}

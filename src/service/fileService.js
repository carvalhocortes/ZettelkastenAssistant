'use strict'

const aws = require('aws-sdk')
const s3 = new aws.S3({ region: process.env.REGION })

const constants = require('../common/constants')
const questions = require('../common/questions')
const fileErrors = require('../common/fileErrors')
const docalysisConnector = require('../connector/docalysisConnector')
const mendeleyConnector = require('../connector/mendeleyConnector')
const fileDb = require('../db/fileDb')
const userDb = require('../db/userDb')
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
    Key: `${ owner }/${ fileName }`,
    Expires: constants.file.defaultSignedUrlExpirationInSeconds,
  }
  if (type && command === 'put') {
    if (!Object.hasOwn(questions, type)) throw fileErrors.documentTypeNotSupported
    params.Metadata = { type }
  }

  return { url: await s3.getSignedUrlPromise(getS3CommandName(command), params) }
}

const handleReceivedFile = async (event) => {
  const { fileKey, fileName, bucket, owner } = parseS3Event(event)
  const { url } = await createPreSignedUrl({ fileName }, 'files', 'get', owner)
  const s3File = await s3.getObject({ Bucket: bucket, Key: fileKey}).promise()
  const file = await fileDb.save({ owner, type: s3File.Metadata?.type, fileName, status: constants.file.status.created })
  const docalysisResponse = await docalysisConnector.sentFileToDocalysis(fileName, url)
    .catch (async (error) => handlePartnerError(error, file.id, 'sending file to Docalysis'))
  const fileUpdateFields = {
    docalysisData: docalysisResponse.file,
    scheduledProcessName: constants.scheduledProcess.getNewStatus,
    scheduledProcessAfter: afterMinutes(1),
    status: constants.file.status.pendingAnswer
  }
  const user = await userDb.getByEmail(owner)
  if (user?.config?.useMendeley) {
    const fileContent = s3File.Body.toString('utf-8')
    const mendeleyResponse = await mendeleyConnector.createMendeleyDocument(fileName, fileContent, owner)
      .catch (async (error) => handlePartnerError(error, file.id, 'creating Mendeley document'))
    fileUpdateFields.mendeleyData = mendeleyResponse
  }
  return fileDb.update(fileUpdateFields, file.id)
}

const updateFileData = async event => {
  const owner = event.session.email
  const { pathParameters: { fileId }, body: { updateFileData} } = event
  const file = await fileDb.getById(fileId)
  const mendeleyResponse = await mendeleyConnector.updateDocument(file.mendeleyData.id, updateFileData, owner)
  const updateData = {
    data: updateData,
    mendeleyData: mendeleyResponse,
    status: constants.file.status.created
  }
  return fileDb.update(updateData, { id: fileId })
}

// PRIVATE FUNCTIONS

const handlePartnerError = async (error, fileId, errorLocation) => {
  const fileUpdateFields = {
    status: constants.file.status.error,
    errorLocation
  }
  await fileDb.update(fileUpdateFields, fileId)
  throw error
}

const getS3BucketName = (bucketName) => {
  const buckets = {
    files: process.env.FILES_BUCKET,
    avatar: process.env.USER_AVATAR_BUCKET
  }
  const selected = buckets[bucketName]
  if (!selected) throw fileErrors.bucketInexistent
  return selected
}

const getS3CommandName = (command) => {
  const commands = {
    get: 'getObject',
    put: 'putObject',
    delete: 'deleteObject'
  }
  const selected = commands[command]
  if (!selected) throw fileErrors.commandIsNotValid
  return selected
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
    scheduledProcessAfter: afterMinutes(1),
    status: constants.file.status.pendingAnswer
  }
  return fileDb.update(fileUpdateFields, file.id, ['errorLocation', 'error'])
}

const askDocalysisStatus = async (file) => {
  const docalysisAnswer = await docalysisConnector.askToFile(file.docalysisData.id, `${ constants.docalysis.answerInJson }${ questions[file.type] }`)
    .catch (async (error) => handlePartnerError(error, file.id, 'asking Docalysis'))
  const fileUpdateFields = {
    docalysisAnswers: JSON.parse(docalysisAnswer.response),
    status: constants.file.status.analyzed
  }
  return fileDb.update(fileUpdateFields, file.id, ['errorLocation', 'error', 'scheduledProcessName', 'scheduledProcessAfter'])
}

module.exports = {
  // downloadFile,
  createPreSignedUrl,
  handleReceivedFile,
  scheduledProcess,
  updateFileData
}

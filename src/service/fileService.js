'use strict'

const aws = require('aws-sdk')
const s3 = new aws.S3()

const constants = require('../common/constants')
const fileErrors = require('../common/fileErrors')
const docalysisConnector = require('../connector/docalysisConnector')
// const mendeleyConnector = require('../connector/mendeleyConnector')
const filesDb = require('../db/fileDb')
const { afterMinutes } = require('../helper/timeHelper')
const { log } = require('../helper/loggerHelper')

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
  // const { fileName, user } = parseS3Event(event)
  // const { url } = await createPreSignedUrl(fileName, 'files', 'get', user)
  const user = 'fernando'

  const token = 'am6nebzgtlehx8382jw6xxyaghf2i3qc'
  const url = 'https://zettelkasten-files-dev.s3.us-east-2.amazonaws.com/pasta-1234%40gmail.com/BEEGHLY%20-%20Whats%20Wrong%20with%20Stereotypes.pdf?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjED0aCXNhLWVhc3QtMSJGMEQCIHYuGtEaDQGcQZ%2BfkaxJ5eYVkTlaRNoVC3mS%2F3FqaQpdAiAMNgQd%2F7dxKikuc%2F5SbPySabQcmqdVtxoanghZwhpRCSrkAgh2EAAaDDE4MDUxNDM3MjEyNCIMSTajHqhJV0GtZe5qKsECq%2FDBN2m0SJ%2BAsDYTClUW7Rkkp4pCOQec2pXRhMskVEwNvZArw%2F%2Bwifm8RSIUmmNz6AGFtMHARgq6yLR28cxBIygK4QPggr%2BS0DSFJCS3Owma6s4cZwy%2Fv7E0MY3rQe2b3Z1jXw%2BrfYI6rdSijUpPDPGE769ZoFPyKT2bf6RJy0PjIQ6tP3LYgBPIQDF6J9sgItLi5%2BmQPGsZKJhufgknKGiJDVZ43sEkyK6v5VWO70jWudi7AvtIJ6DIoBKBtiF2g4EsdoIxkUyZF%2FzXra4zPOk7x8o%2BSerbSY4aE7SR%2BAxnei%2FNGkl3ajYhZmAaNA68CKfa7KNIojegKQZ%2BmNNe6sWxbzVgQN278EtEbDbKvv6DfgyArgpxxHkbxrZI6Tak6GzvaTJ38iTaFwvnkOlqcC0uwPzXIJT82bEPR8X4TlNmMLmOnqoGOrQCPPjKjmfNFOZ9Em92a8BhS6SftzzStf8FTAxXBU6kQnrlBKFeXlhOj71KKDhHm1W32MncFrjukJxvkPtojPLt5Wf%2BmB9tn%2BUmM2aXAg28fekQU9JZicPdBlcPBjiP9SsNT1YEhznQGT2k9I3nUv7zb8aFwFNBvZVvItYSQFHXh4srvimt0WtX9rq4AxHIw%2FOLes7mJAJi4yMJLrVs2LH%2BxwkxymF9sKfab6zfAgEIELhEcwY4cjKZlbOq6c9dZJUsvrTZKTD8Y24M3FvO8rJdx%2FbSkgF4zJGA%2FJa4Vx1YGhtYyRx6ex7EcvnTnViG28F%2BzsezMt2l6RCWRxj2okb07e47HSOsDVhm7OvvEdnPVUnBiFEJluu9RKbXX01Ch9Wtn2uENr8VaejBu5wFaMkQeRee6wU%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20231105T215854Z&X-Amz-SignedHeaders=host&X-Amz-Expires=43200&X-Amz-Credential=ASIASUB36XIOCYB6SGXZ%2F20231105%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Signature=2c4889cfa472de295c81a4a4d4bd45995c247bcf012c1a1731b39b1277e5b43f'
  const fileName = 'BEEGHLY - Whats Wrong with Stereotypes.pdf'
  const docalysisResponse = await docalysisConnector.sentFileToDocalysis(fileName, url, token)
    .catch (async (error) => handlePartnerError(error, user, fileName, 'docalysis'))
  // const mendeleyResponse = await mendeleyConnector.sentFileToMendeley()
  //   .catch (async (error) => handlePartnerError(error, user, fileName, 'mendeley'))
  const processAfter = afterMinutes(5)
  const processFunction = constants.processAfter.docalysis
  const status = constants.file.status.pending
  const fileData = assembleFileData({ user, fileName, processAfter, processFunction, docalysisResponse, status })
  return filesDb.save(fileData)
}

// PRIVATE FUNCTIONS

const handlePartnerError = async (error, user, fileName, partner) => {
  const status = constants.file.status.error
  const fileData = assembleFileData({ user, fileName, status })
  fileData.errorLocation = partner
  await filesDb.save(fileData)
  throw error
}

const assembleFileData = ({ user, fileName, processAfter, processFunction, docalysisResponse, mendeleyResponse, status }) => ({
  user,
  fileName,
  processAfter,
  processFunction,
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
  const s3Event = event.Records[0].s3
  const [user, fileName] = decodeURIComponent(s3Event.object.key.replace(/\+/g, ' ')).split('/')
  return { fileName, user }
}

module.exports = {
  // downloadFile,
  createPreSignedUrl,
  handleReceivedFile
}

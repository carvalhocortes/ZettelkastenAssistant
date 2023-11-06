const { success, error, processEvent } = require('../util/lambdaUtil')
const fileValidator = require('../validator/fileValidator')
const fileService = require('../services/fileService')

const createPreSignedUrl = async (event) => {
  return processEvent(event, 'zettelkasten')
    .then(event => fileValidator.validateCreatePreSignedUrl(event))
    .then(({ body: { fileName, bucketName, command }, session: { email } }) => fileService.createPreSignedUrl(fileName, bucketName, command, email))
    .then(response => success(response))
    .catch(err => error(err))
}

const handleFileUploaded = async (event) => {
  return processEvent(event)
    .then(() => fileService.handleReceivedFile(event))
    .then(response => success(response))
    .catch(err => error(err))
}

module.exports = {
  createPreSignedUrl,
  handleFileUploaded
}

const { success, error, processEvent } = require('../helper/lambdaHelper')
const fileValidator = require('../validator/fileValidator')
const fileService = require('../service/fileService')

const createPreSignedUrl = async (event) => {
  return processEvent(event, 'zettelkasten')
    .then(event => fileValidator.validateCreatePreSignedUrl(event))
    .then(({ body: { fileName, type, bucketName, command }, session: { email } }) => fileService.createPreSignedUrl({ fileName, type }, bucketName, command, email))
    .then(response => success(response))
    .catch(err => error(err))
}

const handleFileUploaded = async (event) => {
  return processEvent(event)
    .then(() => fileService.handleReceivedFile(event))
    .then(response => success(response))
    .catch(err => error(err))
}

const updateFileData = async (event) => {
  return processEvent(event, 'zettelkasten')
    .then(event => fileValidator.validadeUpdateFileData(event))
    .then(() => fileService.updateFileData(event))
    .then(response => success(response))
    .catch(err => error(err))
}

module.exports = {
  createPreSignedUrl,
  handleFileUploaded,
  updateFileData
}

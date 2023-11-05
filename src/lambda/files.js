const { success, error, processEvent } = require('../util/lambdaUtil')
const fileValidator = require('../validator/fileValidator')
const fileService = require('../services/fileService')

const createPreSignedUrl = async (event) => {
  return processEvent(event, 'zettelkasten')
    .then(event => fileValidator.validateCreatePreSignedUrl(event))
    .then(event => fileService.createPreSignedUrl(event))
    .then(response => success(response))
    .catch(err => error(err))
}

const handleFileUploaded = async (event) => {
  try {
    const processedEvent = processEvent(event)
    return success(processedEvent)
  } catch (err) {
    return error(err)
  }
}

module.exports = {
  createPreSignedUrl,
  handleFileUploaded
}

const { success, error, processEvent } = require('../util/lambdaUtil')
const fileValidator = require('../validator/fileValidator')
const fileService = require('../services/fileService')

const createPreSignedUrl = async (event) => {
  try {
    const processedEvent = processEvent(event, 'zettelkasten')
    const {
      body: { bucketName, fileName },
      session: { email }
    } = fileValidator.validateCreatePreSignedUrl(processedEvent)
    const url = fileService.createPreSignedUrl(fileName, bucketName, email)
    return success(url)
  } catch (err) {
    return error(err)
  }
}

const handleFileUploaded = async (event) => {
  try {
    return success(response)
  } catch (err) {
    return error(err)
  }
}

module.exports = {
  createPreSignedUrl,
  handleFileUploaded
}

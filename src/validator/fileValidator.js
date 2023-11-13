const commonErrors = require("../common/commonErrors")

const { checkRequired } = require('../helper/validatorHelper')

const validateCreatePreSignedUrl = async event => {
  if (!event.body) throw commonErrors.requiredField('body')
  checkRequired(event.body.fileName, 'fileName')
  checkRequired(event.body.bucketName, 'bucketName')
  checkRequired(event.body.command, 'command')
  if (event.body.command === 'put') checkRequired(event.body.type, 'type')
  return event
}

const validadeUpdateFileData = async event => {
  if (!event.body) throw commonErrors.requiredField('body')
  checkRequired(event.body.updateFileData, 'updateFileData')
  if (!event.body) throw commonErrors.requiredField('body')
  checkRequired(event.pathParameters.fileId, 'fileId')
}

module.exports = {
  validateCreatePreSignedUrl,
  validadeUpdateFileData
}

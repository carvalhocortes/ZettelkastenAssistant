const commonErrors = require("../common/commonErrors")

const { checkRequired } = require('../util/validatorUtil')

const validateCreatePreSignedUrl = async event => {
  if (!event.body) throw commonErrors.requiredField('body')
  checkRequired(event.body.fileName, 'fileName')
  checkRequired(event.body.bucketName, 'bucketName')
  checkRequired(event.body.command, 'command')
  return event
}

module.exports = {
  validateCreatePreSignedUrl
}

const constants = require("../common/constants")
const commonErrors = require("../common/commonErrors")
const fileErrors = require("../common/fileErrors")

const validateCreatePreSignedUrl = (event, url) => {
  if (!event.body) throw commonErrors.requiredField('body')
  checkRequired(event.body.fileName, 'fileName')
  checkRequired(event.body.bucketName, 'bucketName')
  if (!constants.buckets.includes(bucketName)) throw fileErrors.inexistentBucket
  return event
}

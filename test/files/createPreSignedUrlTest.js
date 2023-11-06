const { buildEvent, testSuccess, testRequired, testError, createActivatedUser, authenticateUser } = require('../helper/testHelper')

const createPreSignedUrlFunc = require('../../src/lambda/files').createPreSignedUrl

describe('Create Pre Signed URL tests', () => {
  before(async () => {
    user = await createActivatedUser()
    await authenticateUser(user)
  })
  it('Should validate the input', async() => {
    const event = buildEvent({ fileName: 'file', bucketName: 'bucket', command: 'command' })
    await testRequired(createPreSignedUrlFunc, event, 'body', errorsNumber.requiredField)
    await testRequired(createPreSignedUrlFunc, event, 'body.fileName', errorsNumber.requiredField)
    await testRequired(createPreSignedUrlFunc, event, 'body.bucketName', errorsNumber.requiredField)
  })
  it('Should return a error if the token dont exist', async() => {
    const event = buildEvent(undefined, undefined, undefined, 'inexiste token' )
    await testError(createPreSignedUrlFunc, event, 401, errorsNumber.invalidToken)
  })
  it('Should return a error if the bucket dont exist', async() => {
    const event = buildEvent({ fileName: 'file', bucketName: 'inexistent bucket', command: 'unchecked' })
    await testError(createPreSignedUrlFunc, event, 400, errorsNumber.bucketInexistent)
  })
  it('Should return a error if the command isnt valid', async() => {
    const event = buildEvent({ fileName: 'file.txt', bucketName: 'files', command: 'inexistent command' })
    await testError(createPreSignedUrlFunc, event, 400, errorsNumber.commandIsNotValid)
  })
  it('Should return a url', async() => {
    const event = buildEvent({ fileName: 'file.txt', bucketName: 'files', command: 'put' })
    const { url } = await testSuccess(createPreSignedUrlFunc, event)
    url.should.be.ok()
  })
})

const errorsNumber = {
  requiredField: 1001,
  invalidToken: 1002,
  bucketInexistent: 3001,
  commandIsNotValid: 3002,
}

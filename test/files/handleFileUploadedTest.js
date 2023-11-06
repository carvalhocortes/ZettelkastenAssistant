const fileDb = require('../../src/db/fileDb')
const {  testSuccess, testError, mockSentFileToDocalysis } = require('../utils/testUtils')
const uuid = require('uuid').v4

const handleFileUploadedFunc = require('../../src/lambda/files').handleFileUploaded

describe('Handle uploaded file tests', () => {
  it('Should return error if any problem in Docalysis', async() => {
    const event = buildS3Event()
    mockSentFileToDocalysis(assembleDocalysisResponse(false))
    await testError(handleFileUploadedFunc, event, 400, errorsNumber.docalysisError)
  })
  // it('Should return error if any problem in Mendeley', async() => {
  //   const event = buildS3Event()
  //   const docalysisResponse = assembleDocalysisResponse(true)
  //   mockSentFileToDocalysis(docalysisResponse)
  //   await testError(handleFileUploadedFunc, event, 400, errorsNumber.mendeleyError)
  // })
  it('Should request analysis and save file', async() => {
    const event = buildS3Event()
    const docalysisResponse = assembleDocalysisResponse(true)
    mockSentFileToDocalysis(docalysisResponse)
    // mockar mendeley
    const { id } = await testSuccess(handleFileUploadedFunc, event)
    const fileData = await fileDb.getById(id)
    fileData.should.have.property('fileName')
    fileData.should.have.property('user')
    fileData.should.have.property('status').which.is.equal('pending')
    // fileData.should.have.property('mendeleyData')Cert
    fileData.should.have.property('docalysisData')
    fileData.should.have.property('processAfter')
    fileData.should.have.property('processFunction').which.is.equal('processDocalysis')
    fileData.docalysisData.should.have.property('id')
    fileData.docalysisData.should.have.property('processed_state')
    fileData.should.have.property('docalysisData')
  })
})

// PRIVATE FUNCTIONS

const buildS3Event = () => ({
  Records: [
    {
      s3: {
        bucket: {
          name: 'BucketName'
        },
        object: {
          key: 'user@gmail.com/fileName+date.txt'
        }
      }
    }
  ]
})

const assembleDocalysisResponse = (success) => {
  if (success) return {
    success,
    file: {
      id: uuid(),
      created_at: 1686887578000,
      file_size: 184292,
      file_type: "pdf",
      name: "my_file.pdf",
      page_count: 9,
      processed_state: "unprocessed"
    }
  }
  return {
    success,
    error: 'You do not have access to this file.'
  }
}

const errorsNumber = {
  docalysisError: 3003,
  mendeleyError: 3004,
}

const fileDb = require('../../src/db/fileDb')
const {  testSuccess, testError, mockSentFileToDocalysis } = require('../helper/testHelper')

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
  it('Should save file and request analysis', async() => {
    const event = buildS3Event()
    mockSentFileToDocalysis(assembleDocalysisResponse(true))
    // mockar mendeley
    const { id } = await testSuccess(handleFileUploadedFunc, event)
    const fileData = await fileDb.getById(id)
    fileData.should.have.property('fileName').which.is.equal('fileName date.txt')
    fileData.should.have.property('owner').which.is.equal('user@gmail.com')
    fileData.should.have.property('status').which.is.equal('pending answer')
    fileData.should.have.property('type').which.is.equal('book')
    fileData.should.have.property('scheduledProcessAfter')
    fileData.should.have.property('scheduledProcessName').which.is.equal('getNewStatus')
    fileData.should.have.property('docalysisData')
    fileData.docalysisData.should.have.property('id').which.is.equal('2462456')
    fileData.docalysisData.should.have.property('processed_state').which.is.equal('unprocessed')
    // fileData.should.have.property('mendeleyData')
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
      id: '2462456',
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

const fileDb = require('../../src/db/fileDb')
const {  testSuccess, buildEvent, mockSentFileToDocalysis, mockCheckAndUpdateStatus, mockAskDocalysis } = require('../helper/testHelper')

const handleFileUploadedFunc = require('../../src/lambda/files').handleFileUploaded
const scheduledProcess = require('../../src/lambda/scheduledProcess').scheduledProcess

let id = ''
let fileId = ''

describe('Scheduled file process tests', () => {
  before(async () => {
    await fileDb.clearTable()
    const uploadedEvent = buildS3Event()
    mockSentFileToDocalysis(docalysisFileResponse(true, 'unprocessed'))
    id = (await testSuccess(handleFileUploadedFunc, uploadedEvent)).id
    const fileData = await fileDb.getById(id)
    fileId = fileData.docalysisData.id
  })
  it('Should process records scheduled to update info and keeps it scheduled if there is an error', async() => {
    mockCheckAndUpdateStatus(fileId, docalysisFileResponse(false))
    await testSuccess(scheduledProcess, buildEvent({ date: '2099-01-01 23:59:59' }))
    const fileData = await fileDb.getById(id)
    fileData.should.have.property('status').which.is.equal('error')
    fileData.should.have.property('scheduledProcessAfter')
    fileData.should.have.property('scheduledProcessName').which.is.equal('getNewStatus')
    fileData.should.have.property('errorLocation').which.is.equal('getting file info on Docalysis')
    fileData.docalysisData?.should.have.property('processed_state').which.is.equal('unprocessed')
  })
  it('Should process all records scheduled to update info', async() => {
    mockCheckAndUpdateStatus(fileId, docalysisFileResponse(true, 'processed'))
    await testSuccess(scheduledProcess, buildEvent({ date: '2099-01-01 23:59:59' }))
    const fileData = await fileDb.getById(id)
    fileData.should.have.property('status').which.is.equal('pending answer')
    fileData.should.have.property('scheduledProcessAfter')
    fileData.should.have.property('scheduledProcessName').which.is.equal('askDocalysis')
    fileData.should.not.have.property('errorLocation')
    fileData.docalysisData?.should.have.property('processed_state').which.is.equal('processed')
  })
  it('Should process records scheduled to make Docalysis questions and keeps it scheduled if there is an error', async() => {
    mockAskDocalysis(fileId, 404)
    await testSuccess(scheduledProcess, buildEvent({ date: '2099-01-01 23:59:59' }))
    const fileData = await fileDb.getById(id)
    fileData.should.have.property('status').which.is.equal('error')
    fileData.should.have.property('scheduledProcessAfter')
    fileData.should.have.property('scheduledProcessName').which.is.equal('askDocalysis')
    fileData.should.have.property('errorLocation').which.is.equal('asking Docalysis')
    fileData.should.not.have.property('docalysisAnswers')
  })
  it('Should process all records scheduled to make Docalysis questions', async() => {
    mockAskDocalysis(fileId)
    await testSuccess(scheduledProcess, buildEvent({ date: '2099-01-01 23:59:59' }))
    const fileData = await fileDb.getById(id)
    fileData.should.have.property('status').which.is.equal('analyzed')
    fileData.should.not.have.property('scheduledProcessAfter')
    fileData.should.not.have.property('scheduledProcessName')
    fileData.should.not.have.property('errorLocation')
    fileData.should.have.property('docalysisAnswers')
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
          key: 'otherUser@gmail.com/fileName+date.txt'
        }
      }
    }
  ]
})

const docalysisFileResponse = (success, processed_state) => {
  if (success) return {
    success,
    file: {
      id: '2462456',
      created_at: 1686887578000,
      file_size: 184292,
      file_type: "pdf",
      name: "my_file.pdf",
      page_count: 666,
      processed_state
    }
  }
  return {
    success,
    error: 'You do not have access to this file.'
  }
}

const errorsNumber = {
  docalysisError: 3003,
}

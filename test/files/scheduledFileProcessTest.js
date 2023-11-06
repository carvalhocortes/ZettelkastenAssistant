const { minutesToMilliseconds } = require('date-fns')
const fileDb = require('../../src/db/fileDb')
const {  testSuccess, testError, buildEvent, mockSentFileToDocalysis, mockCheckAndUpdateStatus } = require('../helper/testHelper')

const handleFileUploadedFunc = require('../../src/lambda/files').handleFileUploaded
const scheduledProcess = require('../../src/lambda/scheduledProcess').scheduledProcess

let id = ''
let fileId = { }

describe('Scheduled file process tests', () => {
  before(async () => {
    await fileDb.clearTable()
    const uploadedEvent = buildS3Event()
    mockSentFileToDocalysis(sentFileToDocalysisResponse(true, 'unprocessed'))
    id = (await testSuccess(handleFileUploadedFunc, uploadedEvent)).id
    const fileData = await fileDb.getById(id)
    fileId = fileData.docalysisData.id
  })
  it('Should process records scheduled to update info and keeps it scheduled if there is an error', async() => {
    mockCheckAndUpdateStatus(fileId, sentFileToDocalysisResponse(false))
    const event = buildEvent({ date: '2099-01-01 23:59:59' })
    await testSuccess(scheduledProcess, event)
    const fileData = await fileDb.getById(id)
    fileData.should.have.property('status').which.is.equal('error')
    fileData.should.have.property('scheduledProcessAfter')
    fileData.should.have.property('scheduledProcessName').which.is.equal('getNewStatus')
    fileData.should.have.property('docalysisData')
    fileData.docalysisData.should.have.property('id').which.is.equal('2462456')
    fileData.docalysisData.should.have.property('processed_state').which.is.equal('unprocessed')
  })
  it('Should process all records scheduled to update info', async() => {
    mockCheckAndUpdateStatus(fileId, sentFileToDocalysisResponse(true, 'processed'))
    const event = buildEvent({ date: '2099-01-01 23:59:59' })
    await testSuccess(scheduledProcess, event)
    const fileData = await fileDb.getById(id)
    fileData.should.have.property('status').which.is.equal('pending answer')
    fileData.should.have.property('scheduledProcessAfter')
    fileData.should.have.property('scheduledProcessName').which.is.equal('askDocalysis')
    fileData.should.have.property('docalysisData')
    fileData.docalysisData.should.have.property('id').which.is.equal('2462456')
    fileData.docalysisData.should.have.property('processed_state').which.is.equal('processed')
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

const sentFileToDocalysisResponse = (success, processed_state) => {
  if (success) return {
    success,
    file: {
      id: '2462456',
      created_at: 1686887578000,
      file_size: 184292,
      file_type: "pdf",
      name: "my_file.pdf",
      page_count: 9,
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
  mendeleyError: 3004,
}

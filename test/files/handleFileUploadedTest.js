const fileDb = require('../../src/db/fileDb')
const userDb = require('../../src/db/userDb')
const { now } = require('../../src/helper/timeHelper')

const {  testSuccess, testError, mockSentFileToDocalysis, mockCreateMendeleyDocument } = require('../helper/testHelper')

const handleFileUploadedFunc = require('../../src/lambda/files').handleFileUploaded

describe('Handle uploaded file tests', () => {
  before(async () => {
    const user = await userDb.save({
      email: 'user@gmail.com',
      config: {
        useMendeley: true
      },
      mendeleyTokens: {
        accessToken: now(),
        validUntil: now() + (30 * 60 * 1000),
      }
    })
  })
  it('Should return error if any problem in Docalysis', async() => {
    mockSentFileToDocalysis(assembleDocalysisResponse(false))
    await testError(handleFileUploadedFunc, buildS3Event(), 400, errorsNumber.docalysisError)
  })
  it('Should return error if any problem in Mendeley', async() => {
    mockSentFileToDocalysis(assembleDocalysisResponse(true))
    mockCreateMendeleyDocument(assembleCreateMendeleyDocumentResponse(), 404)
    await testError(handleFileUploadedFunc, buildS3Event(), 400, errorsNumber.mendeleyError)
  })
  it('Should save file and request analysis', async() => {
    const event = buildS3Event()
    mockSentFileToDocalysis(assembleDocalysisResponse(true))
    mockCreateMendeleyDocument(assembleCreateMendeleyDocumentResponse())
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
    fileData.should.have.property('mendeleyData')
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
      file_type: 'pdf',
      name: 'my_file.pdf',
      page_count: 9,
      processed_state: 'unprocessed'
    }
  }
  return {
    success,
    error: 'You do not have access to this file.'
  }
}

const assembleCreateMendeleyDocumentResponse = () => ({
  title: 'Title of the document chosen by Mendeley',
  type: 'mendeley type',
  authors: [
      {
          first_name: 'William',
          last_name: 'Baude'
      }
  ],
  websites: [
      'http://www.website.com'
  ],
  id: 'random id',
  created: '2023-11-10T16:30:47.335Z',
  file_attached: true,
  profile_id: 'random profile id',
  last_modified: '2023-11-10T16:30:47.335Z',
  abstract: 'a small abstract created by mendeley'
})

const errorsNumber = {
  docalysisError: 3003,
  mendeleyError: 3006,
}

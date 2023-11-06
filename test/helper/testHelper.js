const should = require('should')
const uuid = require('uuid').v4
const nock = require('nock')

const createUserFunc = require('../../src/lambda/users').createUser
const activateUserFunc = require('../../src/lambda/users').activateUser
const authUserFunc = require('../../src/lambda/users').authenticate

const docalysisBaseUrl = 'https://api1.docalysis.com/api/v1'

const buildEvent = (body, pathParameters, queryStringParameters, token = global.token) => ({
  headers: { authorization: `Bearer ${token}` },
  body: JSON.stringify(body),
  pathParameters,
  queryStringParameters
})

const testSuccess = async (lambda, event, statusCode = 200) => {
  const usedEvent = JSON.parse(JSON.stringify(event))
  const response = await lambda(usedEvent)
  should(response.statusCode).be.equal(statusCode)
  should(response.headers).have.property('content-type').be.equal('application/json')
  return JSON.parse(response.body)
}

const testError = async (lambda, event, statusCode = 400, codeError) => {
  const usedEvent = JSON.parse(JSON.stringify(event))
  const response = await lambda(usedEvent)
  should(response.statusCode).be.equal(statusCode)
  should(response.headers).have.property('content-type').be.equal('application/json')
  const body = JSON.parse(response.body)
  should(body.code).be.equal(codeError)
  return JSON.parse(response.body)
}

const testRequired = async (functionName, event, requiredField, expectedError) => {
  const copyEvent = { ...event }
  copyEvent.body = copyEvent.body ? JSON.parse(copyEvent.body) : copyEvent.body
  const fieldPath = requiredField.split('.')
  let modifiedEvent= modifyField(copyEvent, fieldPath, undefined)
  await testError(functionName, modifiedEvent, 400, expectedError)
  modifiedEvent = modifyField(copyEvent, fieldPath, null)
  await testError(functionName, modifiedEvent, 400, expectedError)
  modifiedEvent = modifyField(copyEvent, fieldPath, '')
  await testError(functionName, modifiedEvent, 400, expectedError)
  modifiedEvent = modifyField(copyEvent, fieldPath, 'delete')
  await testError(functionName, modifiedEvent, 400, expectedError)
}

const uniqueEmail = () => `${uuid()}@example.com`

const buildUser = (email = uniqueEmail(), password = 'GoodPass@123', permission) => ({
  name: 'John Doe',
  email,
  password,
  birthday: '01/12/1984',
  city: 'San Francisco',
  country: 'US',
  avatar: 'super man',
  permission
})

const createActivatedUser = async(email, password, permission) => {
    const user = buildUser(email, password, permission)
    const createUserEvent = buildEvent(user)
    const { token } = await testSuccess(createUserFunc, createUserEvent, 201)
    const activateUserEvent = buildEvent(undefined, { token })
    await testSuccess(activateUserFunc, activateUserEvent, 200)
    return user
}

const authenticateUser = async(credentials) => {
  const authUserEvent = buildEvent(credentials)
  const { token } = await testSuccess(authUserFunc, authUserEvent, 200)
  global.token = token
  return token
}

const mockSentFileToDocalysis = (response, statusResponse = 200) => {
  nock(docalysisBaseUrl)
    .post('/files/create')
    .reply(statusResponse, response)
}

const mockCheckAndUpdateStatus = (fileId, response, statusResponse = 200) => {
  nock(docalysisBaseUrl)
    .get(`/files/${fileId}/info`)
    .reply(statusResponse, response)
}

// PRIVATE FUNCTIONS

const modifyField = (obj, keys, to) => {
  let currentObj = obj
  for (const key of keys.slice(0, -1)) {
    if (currentObj[key] === undefined) {
      console.error(`Campo ${key} não existe no objeto`)
      return null;
    }
    currentObj = currentObj[key]
  }
  currentObj[keys[keys.length - 1]] = to;
  if (to === 'delete') delete currentObj[keys[keys.length - 1]]
  obj.body = obj.body ? JSON.stringify(obj.body) : obj.body
  return obj
}

module.exports = {
  buildEvent,
  testSuccess,
  testError,
  testRequired,
  uniqueEmail,
  buildUser,
  createActivatedUser,
  authenticateUser,
  mockSentFileToDocalysis,
  mockCheckAndUpdateStatus
}

const should = require('should')
const uuid = require('uuid').v4

const buildEvent = (body, pathParameters, queryStringParameters, token = global.token) => ({
  headers: { Authorization: `Bearer ${token}` },
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
  const response = await lambda(event)
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
};

const uniqueEmail = () => `${uuid()}@example.com`

const buildUser = (email) => ({
  email,
  password: 'GoodPass@123',
  birthDate: '01/12/1984',
  city: 'San Francisco',
  country: 'US',
  avatar: 'super man'
})

module.exports = {
  buildEvent,
  testSuccess,
  testError,
  testRequired,
  uniqueEmail,
  buildUser
}

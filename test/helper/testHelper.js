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
const mockAskDocalysis = (fileId, statusResponse = 200) => {
  const response = {
    success: statusResponse >= 300 ? false : true,
    response: "{\n  \"Identification\": {\n    \"Dissertation Title\": \"Making Doctrinal Work More Rigorous: Lessons from Systematic Reviews\",\n    \"Author\": \"William Baude, Adam S. Chilton, and Anup Malani\",\n    \"Institution\": \"The University of Chicago Law School\",\n    \"Date of Submission\": \"2017\",\n    \"Keywords\": [\"systematic reviews\", \"legal doctrine\", \"methodology\"]\n  },\n  \"Summary\": {\n    \"Research Question\": \"How can legal scholars and judges conduct systematic reviews to support their claims about the state of legal doctrine?\",\n    \"Methodology\": \"The authors propose a four-step process that involves defining the research question, defining and obtaining the sample, explaining any weighting applied to the sample cases, and justifying the manner in which the sample cases are analyzed. They argue that this method can prevent bias and improve the legitimacy of conclusions drawn from reviews.\",\n    \"Main Findings\": \"The authors illustrated the value of their proposed method by applying it to doctrinal claims that have been made in recent legal scholarship. They found that the claims lack systematic support and are often made without a systematic demonstration of supporting evidence.\"\n  },\n  \"Relevant Quotations/Excerpts\": \"Legal scholars, advocates, and judges commonly make positive claims about the state of legal doctrine. For example, a legal scholar might claim that there is a trend in recent federal court decisions to allow a particular pretrial procedure, or a judge might claim that most courts endorse a given legal proposition. These claims, however, are frequently made without a systematic demonstration of supporting evidence. When this occurs, it not only makes it difficult for the reader to evaluate the validity of the claim, but also may impede future legal analysis and allow for either conscious or unconscious bias. (Page 1)\",\n  \"Personal Comments\": null,\n  \"Connections\": null,\n  \"Link/Source\": {\n    \"URL\": \"https://chicagounbound.uchicago.edu/cgi/viewcontent.cgi?article=18520&context=journal_articles\"\n  }\n}"
  }
  nock(docalysisBaseUrl)
    .get(`/files/${fileId}/chat`)
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
  mockCheckAndUpdateStatus,
  mockAskDocalysis
}

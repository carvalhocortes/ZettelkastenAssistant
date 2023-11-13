const should = require('should')
const uuid = require('uuid').v4
const nock = require('nock')

const createUserFunc = require('../../src/lambda/users').createUser
const activateUserFunc = require('../../src/lambda/users').activateUser
const authUserFunc = require('../../src/lambda/users').authenticate

const docalysisBaseUrl = 'https://api1.docalysis.com/api/v1'
const mendeleyBaseUrl = 'https://api.mendeley.com'

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

const uniqueEmail = () => `${ uuid() }@example.com`

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


const mockCreateMendeleyDocument = (response, statusResponse = 200) => {
  nock(mendeleyBaseUrl)
    .post('/documents')
    .reply(statusResponse, response)
}

const mockCheckAndUpdateStatus = (fileId, response, statusResponse = 200) => {
  nock(docalysisBaseUrl)
    .get(`/files/${ fileId }/info`)
    .reply(statusResponse, response)
}

const mockExchangeMendeleyCredentials = (response, statusResponse = 200) => {
  nock(mendeleyBaseUrl)
    .post('/oauth/token')
    .reply(statusResponse, response)
}


const mockAskDocalysis = (fileId, statusResponse = 200) => {
  const response = {
    success: statusResponse >= 300 ? false : true,
    response: "{\n\"Identification\":{\n   \"Dissertation Title\":\"Making Doctrinal Work More Rigorous: Lessons from Systematic Reviews\",\n   \"Author(s)\":[\n      \"William Baude\",\n      \"Adam S. Chilton\",\n      \"Anup Malani\"\n   ],\n   \"Institution\":\"The University of Chicago Law Review\",\n   \"Date of Submission\":\"2017\",\n   \"Keywords\":[\n      \"legal analysis\",\n      \"systematic review\",\n      \"legal doctrine\",\n      \"research question\",\n      \"methodology\"\n   ]\n},\n\"Summary\":{\n   \"Research Question\":\"How can legal scholars make objective claims about the state of legal doctrine in a systematic and transparent way?\",\n   \"Methodology\":\"The authors propose a four-step process for conducting a systematic review of legal doctrine: defining the research question, selecting the sample, weighing the cases, and analyzing the sample. They illustrate the value of this method by applying it to doctrinal claims made in recent legal scholarship.\",\n   \"Main Findings\":\"Systematic reviews tailored to legal analysis can lead to more rigorous, transparent, and reliable claims about the state of legal doctrine. There are benefits to more methodological rigor even if the claims made without such rigor are true. Systematic reviews have been developed in other disciplines to synthesize the results of prior literature on a research question. Legal scholarship would benefit from similar methodological standards.\"\n},\n\"Relevant Quotations/Excerpts\":{\n   \"Page 1\":\"In response to similar issues, other disciplines have developed methodological standards for conducting “systematic reviews” that summarize the state of knowledge on a given subject.\",\n   \"Page 2\":\"In this Essay we argue that legal scholars, lawyers, and judges should conduct a four-step systematic review when they are making positive claims about the state of legal doctrine.\",\n   \"Page 7\":\"Systematic reviews address biases with four basic steps. First, a review’s author clearly defines the question she seeks to answer. Second, the author conducts an exhaustive search for relevant studies. Third, the author appraises the quality of the studies that she has gathered. Fourth, the author synthesizes the results of the different studies that survive.\"\n},\n\"Personal Comments\":\"\",\n\"Connections\":\"\",\n\"Link/Source\":\"https://chicagounbound.uchicago.edu/cgi/viewcontent.cgi?article=22780&context=journal_articles\"\n}"
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
  mockAskDocalysis,
  mockCreateMendeleyDocument,
  mockExchangeMendeleyCredentials
}

const { sign } = require('jsonwebtoken')
const { buildEvent, testSuccess, testRequired, testError, createActivatedUser, authenticateUser, mockExchangeMendeleyCredentials } = require('../helper/testHelper')

const userDb = require('../../src/db/userDb')

const jwtSecret = process.env.JWT_SECRET

const getAuthUrlFunc = require('../../src/lambda/mendeley').getAuthUrl
const callbackFunc = require('../../src/lambda/mendeley').mendeleyCallback

let user

describe('Mendeley Authorization tests', () => {
  before(async () => {
    user = await createActivatedUser()
    await authenticateUser(user)
  })
  it('Should return a error if the token is invalid', async() => {
    const invalidTokenEvent = buildEvent(undefined, undefined, undefined, 'invalid token' )
    await testError(getAuthUrlFunc, invalidTokenEvent, 401, errorsNumber.invalidToken)
  })
  it('Should return a url for a logged user', async() => {
    const response = await testSuccess(getAuthUrlFunc,  buildEvent())
    response.should.have.property('url').be.a.String()
  })
  it('Should handle the callback', async() => {
    const state = getToken(user.email, '1h', 'mendeleyOAuth').token
    const callbackEvent = buildEvent(undefined, undefined, { code: '123456789', state })
    mockExchangeMendeleyCredentials(exchangeMendeleyCredentials())
    const response = await testSuccess(callbackFunc, callbackEvent)
    response.should.have.property('token').be.a.String()
    const updatedUser = await userDb.getByEmail(user.email)
    updatedUser.should.have.property('mendeleyTokens').be.a.Object()
    updatedUser.mendeleyTokens.should.have.property('validUntil').be.a.Number()
    updatedUser.mendeleyTokens.should.have.property('accessToken').be.a.String()
    updatedUser.mendeleyTokens.should.have.property('tokenType').be.a.String()
    updatedUser.mendeleyTokens.should.have.property('refreshToken').be.a.String()
  })
})

// PRIVATE FUNCTIONS

const getToken = (email, expiresIn, audience) => ({
  token: sign({ email }, jwtSecret, { expiresIn, audience })
})

const exchangeMendeleyCredentials = () => ({
  expires_in: 360,
  access_token: 'access token',
  refresh_token: 'refresh token',
  token_type: 'token Type'
})

const errorsNumber = {
  requiredField: 1001,
  invalidToken: 1002,
  inexistentEmail: 2003,
}

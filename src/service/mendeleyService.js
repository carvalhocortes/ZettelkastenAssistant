const { sign } = require('jsonwebtoken')
const { checkTokenAndAudience } = require('../helper/lambdaHelper')
const mendeleyConnector = require('../connector/mendeleyConnector')
const userDb = require('../db/userDb')
const timeHelper = require('../helper/timeHelper')

const jwtSecret = process.env.JWT_SECRET

const mendeleyId = process.env.MENDELEY_ID
const mendeleyOAuthUrl = process.env.MENDELEY_OAUTH_URL
const mendeleyRedirect = process.env.MENDELEY_REDIRECT

const getToken = (email, expiresIn, audience) => ({
  token: sign({ email }, jwtSecret, { expiresIn, audience })
})

const getAuthUrl = async event => {
  const state = getToken(event.session.email, '1h', 'mendeleyOAuth').token
  const url = `${mendeleyOAuthUrl}?client_id=${mendeleyId}&redirect_uri=${mendeleyRedirect}&response_type=code&scope=all&state=${state}`
  return { url }
}

const mendeleyCallback = async event => {
  const { code, state } = event.queryStringParameters
  const { email } = checkTokenAndAudience(state, 'mendeleyOAuth')
  const changedToken = await mendeleyConnector.exchangeAuthorizationCode(code)
  changedToken.validUntil = changedToken.expiresIn + timeHelper.now()
  delete changedToken.expiresIn
  await userDb.update({ mendeleyTokens: changedToken }, email)
  return { token: changedToken.accessToken }
}

module.exports = {
  getAuthUrl,
  mendeleyCallback
}

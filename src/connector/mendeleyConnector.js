'use strict'

const axios = require('axios')

const { log } = require('../helper/loggerHelper')
const fileErrors = require('../common/fileErrors')
const { now } = require('../helper/timeHelper')
const userDb = require('../db/userDb')

const mendeleyId = process.env.MENDELEY_ID
const mendeleySecret = process.env.MENDELEY_SECRET
const mendeleyRedirect = process.env.MENDELEY_REDIRECT

const baseUrl = 'https://api.mendeley.com'

const exchangeAuthorizationCode = async (code) => {
  const body = {
    code,
    redirect_uri: mendeleyRedirect,
    grant_type: 'authorization_code',
    client_id: mendeleyId,
    client_secret: mendeleySecret
  }
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  const response = await mendeleyApi.post('/oauth/token', body, { headers })
  return assembleOAuthResponse(response)
}

const createMendeleyDocument = async (filename, data, owner) => {
  const token = await getValidToken(owner)
  const headers = {
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/pdf'
  }
  return mendeleyApi.post('/documents', data, { headers })
}

// PRIVATE FUNCTIONS

const assembleOAuthResponse = (response) => {
  const validUntil = (response.expires_in * 1000) + timeHelper.now()
  delete response.expires_in
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
    validUntil
  }
}

const createApi = ({
  onFulfilled = ({ data }) => {
    log({ data })
    return data
  },
  onRejected = error => {
    log({ error })
    throw fileErrors.mendeleyError
  }
} = {}) => {
  const api = axios.create({
    baseURL: encodeURI(baseUrl),
    timeout: 60000
  })
  api.interceptors.response.use(onFulfilled, onRejected)
  return api
}

const mendeleyApi = createApi()

const shouldRefreshToken = (validUntil) => validUntil < now()

const getValidToken = async owner => {
  const user = await userDb.getByEmail(owner)
  if (shouldRefreshToken(user.mendeleyTokens.validUntil)) return refreshToken(user).token
  return user.mendeleyTokens.accessToken
}

const refreshToken = async (user) => {
  const body = {
    refresh_token: user.refreshToken,
    redirect_uri: mendeleyRedirect,
    grant_type: 'refresh_token',
    client_id: mendeleyId,
    client_secret: mendeleySecret
  }
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  const response = await mendeleyApi.post('/oauth/token', body, { headers })
  const updatedToken =  assembleOAuthResponse(response)
  await userDb.update({ mendeleyTokens: updatedToken }, email)
  return { token: updatedToken.accessToken }
}

module.exports = {
  createMendeleyDocument,
  exchangeAuthorizationCode
}

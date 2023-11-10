'use strict'

const axios = require('axios')
const { log } = require('../helper/loggerHelper')
const fileErrors = require('../common/fileErrors')

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

const refreshToken = async (refreshToken) => {
  const body = {
    refresh_token: refreshToken,
    redirect_uri: mendeleyRedirect,
    grant_type: 'refresh_token',
    client_id: mendeleyId,
    client_secret: mendeleySecret
  }
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  const response = await mendeleyApi.post('/oauth/token', body, { headers })
  return assembleOAuthResponse(response)
}

const sentFileToMendeley = async (fileName, url, user) => {

  return { data: 'data' }
}

// PRIVATE FUNCTIONS

const assembleOAuthResponse = (response) => ({
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  tokenType: response.token_type,
  expiresIn: response.expires_in
})

const createApi = ({
  onFulfilled = ({ data }) => {
    log({ data })
    return data
  },
  onRejected = err => {
    log({ err })
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

module.exports = {
  sentFileToMendeley,
  exchangeAuthorizationCode,
  refreshToken
}

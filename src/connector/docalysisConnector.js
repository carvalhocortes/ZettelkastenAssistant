'use strict'

const axios = require('axios')
const { log } = require('../util/loggerUtil')
const fileErrors = require('../common/fileErrors')

const baseUrl = 'https://api1.docalysis.com/api/v1'

const sentFileToDocalysis = async (fileName, url, token) => {
  //pegar o token
  const headers = assembleAuthHeader(token)
  const file = {
    name: fileName,
    url
  }
  const response = await docalysisApi.post('/files/create', file, { headers })
  return checkDocalysisResponseSuccess(response)
}

// PRIVATE FUNCTIONS

const createApi = ({
  onFulfilled = ({ data }) => {
    log({ data })
    return data
  },
  onRejected = err => {
    log({ err })
    return err
  }
} = {}) => {
  const api = axios.create({
    baseURL: encodeURI(baseUrl),
    timeout: 60000
  })
  api.interceptors.response.use(onFulfilled, onRejected)
  return api
}

const docalysisApi = createApi({ onRejected: null })

const assembleAuthHeader = (token, headers = {}) => ({
  ...headers,
  Authorization: `Bearer ${token}`
})

const checkDocalysisResponseSuccess = (response) => {
  if (response?.success !== true) {
    log({ DocalysisError: response?.error })
    throw fileErrors.docalysisError
  }
  return response
}

module.exports = {
  sentFileToDocalysis
}

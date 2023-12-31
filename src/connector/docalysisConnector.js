'use strict'

const axios = require('axios')
const { log } = require('../helper/loggerHelper')
const fileErrors = require('../common/fileErrors')

const baseUrl = 'https://api1.docalysis.com/api/v1'

const token = process.env.DOCALYSIS_TOKEN

const headers = { Authorization: `Bearer ${ token}` }

const sentFileToDocalysis = async (fileName, url) => {
  const file = {
    name: fileName,
    url
  }
  const response = await docalysisApi.post('/files/create', file, { headers })
  return checkDocalysisResponseSuccess(response)
}

const getFileData = async (fileId) => {
  const response = await docalysisApi.get(`/files/${ fileId }/info`, { headers })
  return checkDocalysisResponseSuccess(response)
}

const askToFile = async (fileId, data) => {
  const response = await docalysisApi.get(`/files/${ fileId }/chat`, { headers, data })
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
    throw fileErrors.docalysisError
  }
} = { }) => {
  const api = axios.create({
    baseURL: encodeURI(baseUrl),
    timeout: 60000
  })
  api.interceptors.response.use(onFulfilled, onRejected)
  return api
}

const docalysisApi = createApi()

const checkDocalysisResponseSuccess = (response) => {
  if (response?.success !== true) {
    log({ DocalysisError: response?.error })
    throw fileErrors.docalysisError
  }
  return response
}

module.exports = {
  sentFileToDocalysis,
  getFileData,
  askToFile
}

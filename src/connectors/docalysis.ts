'use strict'

const axios = require('axios')
const aws = require('aws-sdk')
const apiUtils = require('api-utils')(aws)
const { docalysisEndPoints, logs } = require('../res/constants')

const baseUrl = process.env.DOCALYSIS_BASE_URL
const token = process.env.DOCALYSIS_BASE_URL_TOKEN

const showLogs = typeof process.env.SHOW_LOGS === 'undefined' || process.env.SHOW_LOGS === 'true'

const createOrder = async order => {
  const headers = assembleAuthHeader()
  return ewallyApi.post(docalysisEndPoints.marketplace.orders, order, { headers }).catch(handleApiError)
}


// Private
const createApi = (
    { 
        onFulfilled = ({ data }) => log(data, logs.ewallyConnector(apiUtils.logKeys.response)),
        onRejected = err => log(err, logs.ewallyConnector(apiUtils.logKeys.error)) 
    } = {}) => {
  const api = axios.create({
    baseURL: encodeURI(baseUrl),
    timeout: 60000
  })
  api.interceptors.response.use(onFulfilled, onRejected)
  return api
}

const docalysisApi = createApi({ onRejected: null })

const assembleAuthHeader = (headers = {}) => ({
  ...headers,
  Authorization: `Bearer ${token}`
})

const log = (data, logKey) => {
  if (showLogs) apiUtils.log(logKey, data.stack ? data.stack.split('\n') : data)
  return data
}

const handleApiError = (error) => {
  log(error, logs.ewallyConnector(apiUtils.logKeys.error))
  if (error.response) throw error.response.data
  throw error
}


module.exports = {
  createOrder,
  getOrder
}
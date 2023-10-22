const { log } = require('./loggerUtil')
const errors = require('../common/errorMessages')

module.exports.success = (body, status = 200) => {
  log({ status, body })
  return buildHttp(status, body)
}

module.exports.error = (err) => {
  console.log(err)
  if (isUndefined(err.httpCode && err.code && err.msg)) {
    err = errors.defaultError
  }
  log({ err })
  return buildHttp(err.httpCode, { code: err.code, msg: err.msg })
}

const isUndefined = (value) => typeof value === 'undefined'

const buildHttp = (code, body) => {
  const response = {
    statusCode: code,
    body: serializeResponseBody(body),
    // headers: { 'content-type': 'application/json' }
  }
  return response
}

const serializeResponseBody = (body) => {
  const payload = typeof body === 'undefined' || body === null ? {} : body
  return JSON.stringify(payload)
}

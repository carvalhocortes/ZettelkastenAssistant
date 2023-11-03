const { log } = require('./loggerUtil')
const { verify } = require('jsonwebtoken')
const errors = require('../common/errorMessages')

const jwtSecret = process.env.JWT_SECRET

const success = (body, status = 200) => {
  log({ status, body })
  return buildHttp(status, body)
}

const error = (err) => {
  if (isUndefined(err.httpCode && err.code && err.msg)) {
    log({ err })
    err = errors.defaultError
  }
  log({ err })
  return buildHttp(err.httpCode, { code: err.code, msg: err.msg })
}

const processEvent = (event, audience) => {
  let session = ''
  if (audience) session = checkUserAuthorization(event, 'zettelkasten')
  if (event.body) event.body = JSON.parse(event.body)
  event.session = session !== '' ? session : undefined
  return event
}

const checkTokenAndAudience = (token, audience) => {
  try {
    return verify(token, jwtSecret, { audience })
  } catch (error) {
    throw errors.invalidToken
  }
}

// PRIVATE FUNCTIONS

const checkUserAuthorization = (event, audience) => {
  const { authorization } = event.headers
  if (!authorization) throw errors.nonAuthorized
  const [type, token] = authorization.split(' ')
  if (type !== 'Bearer' || !token) throw errors.unsupportedAuthorization
  return checkTokenAndAudience(token, audience)
}

const isUndefined = (value) => typeof value === 'undefined'

const buildHttp = (code, body) => {
  const response = {
    statusCode: code,
    body: serializeResponseBody(body),
    headers: { 'content-type': 'application/json' }
  }
  return response
}

const serializeResponseBody = (body) => {
  const payload = typeof body === 'undefined' || body === null ? {} : body
  return JSON.stringify(payload)
}

module.exports = {
  success,
  error,
  processEvent,
  checkTokenAndAudience
}

const errors = require ('../common/errorMessages')

const validateLogin = event => {
  if (!event.body) throw errors.requestValidationError('body')
  const body = JSON.parse(event.body)
  if (!body.username) throw errors.requestValidationError('username')
  if (!body.password) throw errors.requestValidationError('password')
  return body
}

const validateCreateUser = event => {
  if (!event.body) throw errors.requestValidationError('body')
  const body = JSON.parse(event.body)
  if (!body.username) throw errors.requestValidationError('username')
  if (!body.password) throw errors.requestValidationError('password')
  return body
}

const validateGetUser = (event) => {
  if (!event.pathParameters) throw errors.requestValidationError('pathParameters')
  if (!event.pathParameters.id) throw errors.requestValidationError('id')
  return event.pathParameters
}

module.exports = {
  validateLogin,
  validateCreateUser,
  validateGetUser
}

const errors = require ('../common/errorMessages')

const validateLogin = event => {
  if (!event.body) throw errors.requestValidationError('body')
  if (!event.body.username) throw errors.requestValidationError('username')
  if (!event.body.password) throw errors.requestValidationError('password')
  return event.body
}

const validateCreateUser = event => {
  if (!event.body) throw errors.requestValidationError('body')
  if (!event.body.username) throw errors.requestValidationError('username')
  if (!event.body.password) throw errors.requestValidationError('password')
  return event.body
}

const validateGetUser = (event) => {
  if (!event.pathParameters) throw errors.requestValidationError('pathParameters')
  if (!event.pathParameters.username) throw errors.requestValidationError('username')
  return event.pathParameters
}

const validateUpdateUser = (event) => {
  if (!event.pathParameters) throw errors.requestValidationError('pathParameters')
  if (!event.pathParameters.username) throw errors.requestValidationError('username')
  if (!event.body) throw errors.requestValidationError('body')
  if (event.body.username) throw errors.invalidUpdateField('username')
  if (event.body.password) throw errors.invalidUpdateField('password')
  return event
}

module.exports = {
  validateLogin,
  validateCreateUser,
  validateGetUser,
  validateUpdateUser
}

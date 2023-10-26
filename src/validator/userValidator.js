const errors = require ('../common/errorMessages')

const validateLogin = event => {
  if (!event.body) throw errors.requiredField('body')
  isRequired(event.body.username, 'username')
  isRequired(event.body.password, 'password')
  return event.body
}

const validateCreateUser = event => {
  if (!event.body) throw errors.requiredField('body')
  isRequired(event.body.username, 'username')
  isRequired(event.body.password, 'password')
  return event.body
}

const validateGetUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  isRequired(event.pathParameters.username, 'username')
  return event.pathParameters
}

const validateUpdateUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  isRequired(event.pathParameters.username, 'username')
  if (!event.body) throw errors.requiredField('body')
  if (event.body.username) throw errors.invalidUpdateField('username')
  if (event.body.password) throw errors.invalidUpdateField('password')
  return event
}

const validateDeleteUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  isRequired(event.pathParameters.username, 'username')
  return event.pathParameters
}

const validateActivateUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  isRequired(event.pathParameters.token, 'token')
  return event.pathParameters
}

const validateUnlockUser = (event) => {
  if (!event.body) throw errors.requiredField('body')
  isRequired(event.body.token, 'token')
  isRequired(event.body.password, 'password')
  return event.body
}

// PRIVATE FUNCTIONS

const isRequired = (obj, fieldName) => {
  if (obj === undefined || obj === null || obj === '' || obj === `:${fieldName}`) throw errors.requiredField(fieldName)
}

module.exports = {
  validateLogin,
  validateCreateUser,
  validateGetUser,
  validateUpdateUser,
  validateDeleteUser,
  validateActivateUser,
  validateUnlockUser
}

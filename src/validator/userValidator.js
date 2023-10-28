const errors = require ('../common/errorMessages')

const validateLogin = event => {
  if (!event.body) throw errors.requiredField('body')
  isRequired(event.body.email, 'email')
  isRequired(event.body.password, 'password')
  return event.body
}

const validateCreateUser = event => {
  if (!event.body) throw errors.requiredField('body')
  isRequired(event.body.email, 'email')
  isRequired(event.body.password, 'password')
  isRequired(event.body.city, 'city')
  isRequired(event.body.country, 'country')
  return event.body
}

const validateGetUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  isRequired(event.pathParameters.email, 'email')
  return event.pathParameters
}

const validateUpdateUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  isRequired(event.pathParameters.email, 'email')
  if (!event.body) throw errors.requiredField('body')
  if (event.body.email) throw errors.invalidUpdateField('email')
  if (event.body.password) throw errors.invalidUpdateField('password')
  if (event.body.status) throw errors.invalidUpdateField('status')
  return event
}

const validateDeleteUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  isRequired(event.pathParameters.email, 'email')
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

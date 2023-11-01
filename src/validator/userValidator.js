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
  const body = event.body
  if (body.email) throw errors.invalidUpdateField('email')
  if (body.status) throw errors.invalidUpdateField('status')
  if (Object.keys(body).length < 1) throw errors.requiredField('body')
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

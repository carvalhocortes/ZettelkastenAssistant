const errors = require ('../common/errorMessages')
const { checkRequired } = require('../util/validatorUtil')

const validateLogin = event => {
  if (!event.body) throw errors.requiredField('body')
  checkRequired(event.body.email, 'email')
  checkRequired(event.body.password, 'password')
  return event.body
}

const validateCreateUser = event => {
  if (!event.body) throw errors.requiredField('body')
  checkRequired(event.body.name, 'name')
  checkRequired(event.body.email, 'email')
  checkRequired(event.body.password, 'password')
  checkRequired(event.body.city, 'city')
  checkRequired(event.body.country, 'country')
  return event.body
}

const validateGetUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  checkRequired(event.pathParameters.email, 'email')
  return event.pathParameters
}

const validateUpdateUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  checkRequired(event.pathParameters.email, 'email')
  if (!event.body) throw errors.requiredField('body')
  const body = event.body
  if (body.email) throw errors.invalidUpdateField('email')
  if (body.permission) throw errors.invalidUpdateField('permission')
  if (body.status) throw errors.invalidUpdateField('status')
  if (Object.keys(body).length < 1) throw errors.requiredField('body')
  return event
}

const validateDeleteUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  checkRequired(event.pathParameters.email, 'email')
  return event.pathParameters
}

const validateActivateUser = (event) => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  checkRequired(event.pathParameters.token, 'token')
  return event.pathParameters
}

const validateUnlockUser = (event) => {
  if (!event.body) throw errors.requiredField('body')
  checkRequired(event.body.token, 'token')
  checkRequired(event.body.password, 'password')
  return event.body
}

// PRIVATE FUNCTIONS


module.exports = {
  validateLogin,
  validateCreateUser,
  validateGetUser,
  validateUpdateUser,
  validateDeleteUser,
  validateActivateUser,
  validateUnlockUser
}

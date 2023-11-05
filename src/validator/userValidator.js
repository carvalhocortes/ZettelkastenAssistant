const errors = require("../common/commonErrors")
const { checkRequired } = require('../util/validatorUtil')

const validateLogin = async event => {
  if (!event.body) throw errors.requiredField('body')
  checkRequired(event.body.email, 'email')
  checkRequired(event.body.password, 'password')
  return event.body
}

const validateCreateUser = async event => {
  if (!event.body) throw errors.requiredField('body')
  checkRequired(event.body.name, 'name')
  checkRequired(event.body.email, 'email')
  checkRequired(event.body.password, 'password')
  checkRequired(event.body.city, 'city')
  checkRequired(event.body.country, 'country')
  return event.body
}

const validateGetUser = async event => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  checkRequired(event.pathParameters.email, 'email')
  return event.pathParameters.email
}

const validateUpdateUser = async event => {
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

const validateDeleteUser = async event => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  checkRequired(event.pathParameters.email, 'email')
  return event.pathParameters
}

const validateActivateUser = async event => {
  if (!event.pathParameters) throw errors.requiredField('pathParameters')
  checkRequired(event.pathParameters.token, 'token')
  return event.pathParameters.token
}

const validateUnlockUser = async event => {
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

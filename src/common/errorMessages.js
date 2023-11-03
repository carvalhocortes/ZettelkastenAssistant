const constants = require('./constants')
const errorCode = c => 0 + c

module.exports = {
  defaultError: {
    httpCode: 500,
    code: 0,
    msg: 'Internal error'
  },
  requiredField: (fieldName) => ({
    httpCode: 400,
    code: errorCode(0),
    msg: `The field ${fieldName} are mandatory`
  }),
  invalidPassword:(remainingAttempts) => ({
    httpCode: 401,
    code: errorCode(1),
    msg: `Invalid Password. You have ${remainingAttempts} attempts left`
  }),
  nonAuthorized: {
    httpCode: 401,
    code: errorCode(2),
    msg: 'Non authorized'
  },
  unsupportedAuthorization: {
    httpCode: 401,
    code: errorCode(3),
    msg: 'Unsupported Authorization Method'
  },
  invalidToken: {
    httpCode: 401,
    code: errorCode(4),
    msg: 'Invalid Token'
  },
  inexistentEmail: (email) => ({
    httpCode: 404,
    code: errorCode(5),
    msg: `${email} not registered.`
  }),
  invalidUpdateField: (fieldName) => ({
    httpCode: 400,
    code: errorCode(6),
    msg: `The ${fieldName} field is not updateable`
  }),
  nonActivatableUser: {
    httpCode: 400,
    code: errorCode(7),
    msg: 'User is already active'
  },
  inactivatedUser: {
    httpCode: 401,
    code: errorCode(8),
    msg: 'Is necessary to activate this user'
  },
  lockedUser: {
    httpCode: 401,
    code: errorCode(9),
    msg: 'This user was locked, change the password to unlock it'
  },
  userDontNeedToken: (email) => ({
    httpCode: 400,
    code: errorCode(10),
    msg: `${email} was not locked.`
  }),
  passwordAlreadyUsed: {
    httpCode: 400,
    code: errorCode(11),
    msg: 'This password is already used.'
  },
  invalidPasswordSchema: {
    httpCode: 400,
    code: errorCode(12),
    msg: `Invalid password.`
  },
  invalidEmailSchema: {
    httpCode: 400,
    code: errorCode(14),
    msg: 'The email address must be valid.'
  },
  invalidBirthdaySchema: {
    httpCode: 400,
    code: errorCode(15),
    msg: 'The data should must be valid.'
  },
  emailNotAvailable: {
    httpCode: 400,
    code: errorCode(13),
    msg: `This email is not available`
  },
}

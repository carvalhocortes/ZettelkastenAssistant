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
  alreadyActiveUser: {
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
  userNotLocked: (email) => ({
    httpCode: 400,
    code: errorCode(10),
    msg: `${email} was not locked.`
  }),
  passwordAlreadyUsed: {
    httpCode: 400,
    code: errorCode(8),
    msg: 'This password is already used. Try a different password.'
  },
  invalidPasswordSchema: {
    httpCode: 400,
    code: errorCode(8),
    msg: `The password needs to be at least ${constants.user.passwordPolicy.size} characters and ${constants.user.passwordPolicy.especialCharacters} especial character. Look our password policy.`
  },
  emailNotAvailable: {
    httpCode: 400,
    code: errorCode(8),
    msg: `This email is not available`
  },
}

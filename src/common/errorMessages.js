const errorCode = c => 0 + c

module.exports = {
  defaultError: {
    httpCode: 500,
    code: 0,
    msg: 'Internal error'
  },
  requestValidationError: (fieldName) => ({
    httpCode: 400,
    code: errorCode(0),
    msg: `The field ${fieldName} are mandatory`
  }),
  invalidLogin:{
    httpCode: 401,
    code: errorCode(1),
    msg: 'Invalid Credentials'
  },
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
  inexistentUsername: {
    httpCode: 404,
    code: errorCode(5),
    msg: 'Username inexistent'
  },
  invalidUpdateField: (fieldName) => ({
    httpCode: 400,
    code: errorCode(6),
    msg: `The ${fieldName} field is not updateable`
  })
}


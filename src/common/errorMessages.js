const errorCode = c => 4765 + c

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
  saveError: {
    httpCode: 401,
    code: errorCode(5),
    msg: 'Error saving'
  }
}


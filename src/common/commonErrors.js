const errorCode = c => 1000 + c

module.exports = {
  defaultError: {
    httpCode: 500,
    code: errorCode(0),
    msg: 'Internal error.'
  },
  requiredField: (fieldName) => ({
    httpCode: 400,
    code: errorCode(1),
    msg: `The field ${ fieldName } are mandatory.`
  }),
  invalidToken: {
    httpCode: 401,
    code: errorCode(2),
    msg: 'Invalid Token.'
  },
  unsupportedAuthorization: {
    httpCode: 401,
    code: errorCode(3),
    msg: 'Unsupported Authorization Method.'
  },
  invalidUpdateField: (fieldName) => ({
    httpCode: 400,
    code: errorCode(4),
    msg: `The ${ fieldName } field is not updateable.`
  }),
}

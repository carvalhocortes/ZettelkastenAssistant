const errors = require ('../common/errorMessages')

const checkRequired = (obj, fieldName) => {
  if (obj === undefined || obj === null || obj === '' || obj === `:${fieldName}`) throw errors.requiredField(fieldName)
}

module.exports = {
  checkRequired
}

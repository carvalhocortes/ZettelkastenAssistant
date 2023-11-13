const errors = require ('../common/commonErrors')

const checkRequired = (obj, fieldName) => {
  if (obj === undefined || obj === null || obj === '' || obj === `:${ fieldName }`) throw errors.requiredField(fieldName)
}

module.exports = {
  checkRequired
}

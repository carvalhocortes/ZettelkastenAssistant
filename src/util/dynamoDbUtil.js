
const assembleUpdateExpression = (updateObject, keysToDelete) => {
  updateObject = sanitizeObject(updateObject)
  let updateExpression = 'SET '
  const expressionAttributeValues = {}
  const expressionAttributeNames = {}
  Object.keys(updateObject).forEach((key, index, keys) => {
    const valueKey = `:value${index + 1}`
    expressionAttributeNames[`#${key}`] = key
    updateExpression += `#${key} = ${valueKey}`
    expressionAttributeValues[valueKey] = updateObject[key]
    if (index < keys.length - 1) {
      updateExpression += ', '
    }
  })
  if (keysToDelete){
    delete keysToDelete.username
    delete keysToDelete.password
    delete keysToDelete.createdAt
    updateExpression += ' remove '
    Object.keys(keysToDelete).forEach((key, index, keys) => {
      if (!Object.keys(updateObject).includes(key)){
        expressionAttributeNames[`#${key}`] = key
        if (index >= keys.length - 1) {
          updateExpression += `#${key}, `
        } else {
          updateExpression += `#${key}`
        }
      }
    })
  }
  return { updateExpression, expressionAttributeValues, expressionAttributeNames }
}

// PRIVATE FUNCTIONS

const sanitizeObject = (updateObject) => {
  for (const key in updateObject) {
    if (updateObject[key] === undefined || updateObject[key] === null) {
      delete updateObject[key]}
  }
  return updateObject
}

module.exports = {
  assembleUpdateExpression
}

const assembleUpdateExpression = (updateObject, keysToDelete) => {
  updateObject = sanitizeObject(updateObject)
  keysToDelete = sanitizeObject(keysToDelete)
  let updateExpression = ''
  const expressionAttributeValues = {}
  const expressionAttributeNames = {}
  const attributesToDelete = []
  const attributesToUpdate = []
  if (updateObject){
    Object.keys(updateObject).forEach((key, index) => {
      const valueKey = `:value${index + 1}`
      expressionAttributeNames[`#${key}`] = key
      expressionAttributeValues[valueKey] = updateObject[key]
      attributesToUpdate.push(`#${key} = ${valueKey}`)
    })
  }
  if (keysToDelete){
    delete keysToDelete.email
    delete keysToDelete.createdAt
    Object.keys(keysToDelete).forEach((key) => {
      if(!Object.keys(updateObject).includes(key)){
        expressionAttributeNames[`#${key}`] = key
        attributesToDelete.push(`#${key}`)
      }
    })
  }
  if (attributesToUpdate.length > 0) {
    updateExpression += 'SET '
    attributesToUpdate.forEach((att, index) => {
      updateExpression += `${att} `
      if (index < attributesToUpdate.length - 1) {
        updateExpression += ', '
      }
    })
  }
  if (attributesToDelete.length > 0) {
    updateExpression += 'REMOVE '
    attributesToDelete.forEach((att, index) => {
      updateExpression += `${att} `
      if (index < attributesToDelete.length - 1) {
        updateExpression += ', '
      }
    })
  }
  return { updateExpression, expressionAttributeValues, expressionAttributeNames }
}

// PRIVATE FUNCTIONS

const sanitizeObject = (updateObject) => {
  for (const key in updateObject) {
    if (updateObject[key] === undefined || updateObject[key] === null) delete updateObject[key]
  }
  return updateObject
}

module.exports = {
  assembleUpdateExpression
}

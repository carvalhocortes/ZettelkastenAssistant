const AWS = require('aws-sdk')

const region = process.env.REGION

if (process.env.DB_ENDPOINT?.includes('localhost')) AWS.config.update({ region, endpoint: process.env.DB_ENDPOINT })
else AWS.config.update({ region })

const dynamoDB = new AWS.DynamoDB.DocumentClient()

const save = async (data, tableName) => {
  data.createdAt = new Date().getTime()
  const params = {
    TableName: tableName,
    Item: data
  }
  return dynamoDB.put(params).promise().then(() => params.Item)
}

const update = async (updateData, tableName, key, keysToDelete) => {
  updateData.updatedAt = new Date().getTime()
  const { updateExpression, expressionAttributeValues, expressionAttributeNames } = assembleUpdateExpression(updateData, keysToDelete)
  const params = {
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }
  return dynamoDB.update(params).promise().then(res => res.Attributes)
}

const getByKey = async (key, tableName) => {
  const keyName = Object.keys(key)[0]
  const params = {
    TableName: tableName,
    KeyConditionExpression: '#key = :keyValue',
    ExpressionAttributeNames: {
      '#key': keyName
    },
    ExpressionAttributeValues: {
      ':keyValue': key[keyName]
    }
  }
  const result = await dynamoDB.query(params).promise()
  return result.Items[0]
}

// PRIVATE FUNCTIONS

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

const sanitizeObject = (updateObject) => {
  for (const key in updateObject) {
    if (updateObject[key] === undefined || updateObject[key] === null) delete updateObject[key]
  }
  return updateObject
}

module.exports = {
  save,
  update,
  getByKey
}

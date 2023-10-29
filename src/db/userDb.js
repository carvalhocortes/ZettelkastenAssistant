const AWS = require('aws-sdk')
const { assembleUpdateExpression } = require('../util/dynamoDbUtil')
const constants = require('../common/constants')
const { log } = require('../util/loggerUtil')

const tableName = process.env.USERS_TABLE
const region = process.env.AWS_REGION

AWS.config.update({ region, endpoint: process.env.DB_ENDPOINT, dynamoDbCrc32: false })

const dynamoDB = new AWS.DynamoDB.DocumentClient()

const getByEmail = async (email) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: '#email = :emailVal',
    ExpressionAttributeNames: {
      '#email': 'email'
    },
    ExpressionAttributeValues: {
      ':emailVal': email
    }
  }
  const result = await dynamoDB.query(params).promise()
  return result.Items[0]
}

const getByCredentials = async (email, password) => {
  const params = {
    TableName: tableName,
    IndexName: 'credentialsIndex',
    KeyConditionExpression: '#email = :emailVal AND #password = :passwordVal',
    ExpressionAttributeNames: {
      '#email': 'email',
      '#password': 'password'
    },
    ExpressionAttributeValues: {
      ':emailVal': email,
      ':passwordVal': password
    }
  }
  const result = await dynamoDB.query(params).promise()
  return result.Items[0]
}

const save = async (user) => {
  const status = constants.user.status.pending
  user.status = status
  user.statusLog = [{
    status: status,
    at: new Date().getTime()
  }]
  user.loginData = {
    wrongAttempts: 0,
    lastLoginAt: 'never'
  }
  user.createdAt = new Date().getTime()
  const params = {
    TableName: tableName,
    Item: user
  }
  const result = await dynamoDB.put(params).promise().then(() => params.Item)
  return result
}

const update = async (updateData, email, keysToDelete) => {
  if (updateData.email) delete updateData.email
  updateData.updatedAt = new Date().getTime()
  const { updateExpression, expressionAttributeValues, expressionAttributeNames } = assembleUpdateExpression(updateData, keysToDelete)
  const params = {
    TableName: tableName,
    Key: { 'email': email },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }
  return dynamoDB.update(params).promise().then(res => res.Attributes)
}

module.exports = {
  getByEmail,
  getByCredentials,
  save,
  update
}

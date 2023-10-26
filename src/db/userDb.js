const AWS = require('aws-sdk')
const { assembleUpdateExpression } = require('../util/dynamoDbUtil')
const constants = require('../common/constants')

const tableName = process.env.USERS_TABLE
const region = process.env.REGION

AWS.config.update({ region })

const dynamoDB = new AWS.DynamoDB.DocumentClient()

const getByUsername = async (username) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: '#username = :usernameVal',
    ExpressionAttributeNames: {
      '#username': 'username'
    },
    ExpressionAttributeValues: {
      ':usernameVal': username
    }
  }
  const result = await dynamoDB.query(params).promise()
  return result.Items[0]
}

const getByCredentials = async (username, password) => {
  const params = {
    TableName: tableName,
    IndexName: 'credentialsIndex',
    KeyConditionExpression: '#username = :usernameVal AND #password = :passwordVal',
    ExpressionAttributeNames: {
      '#username': 'username',
      '#password': 'password'
    },
    ExpressionAttributeValues: {
      ':usernameVal': username,
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
  user.lastPasswords = [
    user.password
  ]
  user.createdAt = new Date().getTime()
  const params = {
    TableName: tableName,
    Item: user
  }
  const result = await dynamoDB.put(params).promise().then(() => params.Item)
  return result
}

const update = async (updateData, username) => {
  if (updateData.username) delete updateData.username;
  updateData.updatedAt = new Date().getTime()
  const { updateExpression, expressionAttributeValues, expressionAttributeNames } = assembleUpdateExpression(updateData)
  const params = {
    TableName: tableName,
    Key: { 'username': username },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }
  return dynamoDB.update(params).promise().then(res => res.Attributes)
}

module.exports = {
  getByUsername,
  getByCredentials,
  save,
  update
}

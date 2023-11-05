const AWS = require('aws-sdk')
const dynamoDbUtil = require('../util/dynamoDbUtil')
const constants = require('../common/constants')

const tableName = process.env.USERS_TABLE
const region = process.env.REGION

if (process.env.DB_ENDPOINT?.includes('localhost')) AWS.config.update({ region, endpoint: process.env.DB_ENDPOINT })
else AWS.config.update({ region })

const dynamoDB = new AWS.DynamoDB.DocumentClient()

const getByEmail = async (email) => {
  return dynamoDbUtil.getByKey({ email }, tableName)
}

const save = async (user) => {
  const status = constants.user.status.pending
  user.status = status
  user.statusLog = [{
    status: status,
    at: new Date().getTime()
  }]
  user.loginRecord = {
    wrongAttempts: 0,
    lastLoginAt: 'never'
  }
  return dynamoDbUtil.save(user, tableName)
}

const update = async (updateData, email, keysToDelete) => {
  if (updateData.email) delete updateData.email
return dynamoDbUtil.update(updateData, tableName, { email }, keysToDelete)
}

module.exports = {
  getByEmail,
  save,
  update
}

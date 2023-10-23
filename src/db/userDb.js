const AWS = require('aws-sdk');

const tableName = process.env.USERS_TABLE
const region = process.env.REGION

AWS.config.update({ region })

const dynamoDB = new AWS.DynamoDB.DocumentClient()

// const getById = async (userId) => {}

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
  return result.Items[0];
}

// const save = async (user) => {}

// const update = async (updatedUser) => {}

module.exports = {
  // getById,
  getByCredentials,
  // save,
  // update
}

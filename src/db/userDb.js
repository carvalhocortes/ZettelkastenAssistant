const AWS = require('aws-sdk');

const tableName = process.env.USERS_TABLE
const region = process.env.REGION

AWS.config.update({ region })

const dynamoDB = new AWS.DynamoDB.DocumentClient()

// const getById = async (userId) => {}

const getByCredentials = ({username, password}) => {
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
  return dynamoDB.query(params)
}

// const save = async (user) => {}

// const update = async (updatedUser) => {}

module.exports = {
  // getById,
  getByCredentials,
  // save,
  // update
}

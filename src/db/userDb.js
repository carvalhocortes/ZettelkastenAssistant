const AWS = require('aws-sdk')

const tableName = process.env.USERS_TABLE
const region = process.env.REGION

AWS.config.update({ region })

const dynamoDB = new AWS.DynamoDB.DocumentClient()

const getByUsername = async (username) => {const params = {
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
  user.createdAt = new Date().getTime()
  const params = {
    TableName: tableName,
    Item: user
  }
  const result = await dynamoDB.put(params).promise().then(() => params.Item)
  return result
}

// const update = async (updatedUser, username) => {
  // delete updatedUser.username;
  // updatedUser.updatedAt = new Date().getTime()
// }

module.exports = {
  getByUsername,
  getByCredentials,
  save,
  // update
}

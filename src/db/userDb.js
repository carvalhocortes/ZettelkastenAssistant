const dynamoHelper = require('../helper/dynamoHelper')
const constants = require('../common/constants')

const tableName = process.env.USERS_TABLE

const getByEmail = async (email) => {
  return dynamoHelper.getByKey({ email }, tableName)
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
  return dynamoHelper.save(user, tableName)
}

const update = async (updateData, email, keysToDelete) => {
  if (updateData.email) delete updateData.email
  return dynamoHelper.update(updateData, tableName, { email }, keysToDelete)
}

module.exports = {
  getByEmail,
  save,
  update
}

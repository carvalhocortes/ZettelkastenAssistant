const dynamoDbUtil = require('../util/dynamoDbUtil')
const constants = require('../common/constants')

const tableName = process.env.TABLE_TABLE

const save = async (user) => dynamoDbUtil.save(user, tableName)

const update = async (updateData, id, keysToDelete) => {
  if (updateData.id) delete updateData.id
  return dynamoDbUtil.update(updateData, tableName, { id }, keysToDelete)
}

module.exports = {
  save,
  update
}

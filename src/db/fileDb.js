const uuid = require('uuid').v4

const dynamoDbUtil = require('../util/dynamoDbUtil')
const constants = require('../common/constants')

const tableName = process.env.FILES_TABLE

const save = async (data) => {
  data.id = uuid()
  return dynamoDbUtil.save(data, tableName)
}

const update = async (updateData, id, keysToDelete) => {
  if (updateData.id) delete updateData.id
  return dynamoDbUtil.update(updateData, tableName, { id }, keysToDelete)
}

const getById = async (id) => dynamoDbUtil.getByKey({ id }, tableName)

module.exports = {
  save,
  getById,
  update
}

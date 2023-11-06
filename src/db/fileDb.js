const uuid = require('uuid').v4

const dynamoHelper = require('../helper/dynamoHelper')

const tableName = process.env.FILES_TABLE

const save = async (data) => {
  data.id = uuid()
  return dynamoHelper.save(data, tableName)
}

const update = async (updateData, id, keysToDelete) => {
  if (updateData.id) delete updateData.id
  return dynamoHelper.update(updateData, tableName, { id }, keysToDelete)
}

const getById = async (id) => dynamoHelper.getByKey({ id }, tableName)

module.exports = {
  save,
  getById,
  update
}

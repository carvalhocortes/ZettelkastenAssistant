const { MongoClient, ObjectId } = require('mongodb')

let connectionInstance = null
let tableInstance = null

const connectToDatabase = async () => {
  if (connectionInstance) return connectionInstance
  const client = new MongoClient(process.env.MONGODB_CONNECTIONSTRING)
  const connection = await client.connect()
  connectionInstance = connection.db(process.env.MONGODB_DB_NAME)
  return connectionInstance
}

const getUsersTable = async () => {
  const db = await connectToDatabase()
  if (tableInstance) return tableInstance
  tableInstance = await db.collection('users')
  return tableInstance
}

const getUserByCredentials  = async (username, hashedPassword) => {
  const userTable = await getUsersTable()
  return userTable.findOne({
  name: username,
  password: hashedPassword
})}

const saveUser = async (user) => {
  const userTable = await getUsersTable()
  return userTable.insertOne(user)
}

const getUser = async (userID) => {
  const userTable = await getUsersTable()
  return userTable.findOne({ _id: new ObjectId(userID) })
}

module.exports = {
  saveUser,
  getUser,
  getUserByCredentials
}
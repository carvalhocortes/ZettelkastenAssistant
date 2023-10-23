'use strict'
const { pbkdf2Sync } = require('crypto')
const { sign, verify } = require('jsonwebtoken')

const userDb = require('../db/userDb')
const errors = require('../common/errorMessages')

const salt = process.env.SALT
const jwtSecret = process.env.JWT_SECRET

const hashPassword = password => pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')

const authenticateUser = async (username, password) => {
  const hashedPassword = hashPassword(password)
  const user = await userDb.getByCredentials(username, hashedPassword)
  if (!user) throw errors.invalidLogin
  const token = sign({ username, id: user.id }, jwtSecret, { expiresIn: '24h', audience: 'zettelkasten'})
  return { token }
}

const getUser = async (username) => {
  return userDb.getUser(username)
}

// const saveUser = async (body) => {
//   const { username, password } = body
//   const hashedPassword = hashPassword(password)
//   let user = await userDb.getByCredentials(username, hashedPassword)
//   if (user) return user
//   const assembledUser = assembleNewUser(body)
//   const { insertedId } = await userDb.save(assembledUser)
//   return userDb.getById(insertedId)
// }

// const updateUser = async (body) => {}

// const deleteUser = async (body) => {}

// const checkAuthorization = (event) => {
//   const { authorization } = event.headers
//   if (!authorization) throw errors.nonAuthorized
//   const [type, token] = authorization.split(' ')
//   if (type !== 'Bearer' || !token) throw errors.unsupportedAuthorization
//   const decodedToken = verify(token, jwtSecret, { audience: 'zettelkasten'})
//   if (!decodedToken) throw errors.invalidToken
//   return decodedToken
// }

// // PRIVATE FUNCTIONS

// const assembleNewUser = (body) => ({
//   name: body.username,
//   password: hashPassword(body.password)
// })

module.exports = {
  authenticateUser,
  // getUser,
  // saveUser,
  // updateUser,
  // deleteUser,
  // checkAuthorization
}

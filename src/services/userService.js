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
  const user = await userDb.getByUsername(username)
  if (!user) throw errors.inexistentUsername
  return assembleUserResponse(user)
}

const saveUser = async (body) => {
  const { username, password } = body
  const hashedPassword = hashPassword(password)
  let user = await userDb.getByCredentials(username, hashedPassword)
  if (user) return assembleUserResponse(user)
  const assembledUser = assembleUser(body)
  const savedUser = await userDb.save(assembledUser)
  return assembleUserResponse(savedUser)
}

const updateUser = async (pathParameters, body) => {
  const user = await userDb.getByUsername(pathParameters.username)
  if (!user) throw errors.inexistentUsername
  const assembledUser = ''
  const updatedUser = await userDb.update(assembledUser)
  return assembleUserResponse(updatedUser)
}

// const deleteUser = async (body) => {
//   const user = await userDb.getByUsername(body.username)
//   if (!user) throw errors.inexistentUsername
//   const deletedUser = ''
//   return assembleUserResponse(deletedUser)
// }

// const checkUserAuthorization = (event) => {
//   const { authorization } = event.headers
//   if (!authorization) throw errors.nonAuthorized
//   const [type, token] = authorization.split(' ')
//   if (type !== 'Bearer' || !token) throw errors.unsupportedAuthorization
//   const decodedToken = verify(token, jwtSecret, { audience: 'zettelkasten'})
//   if (!decodedToken) throw errors.invalidToken
//   return decodedToken
// }

// PRIVATE FUNCTIONS

const assembleUser = (user) => {
  const user ={
    username: user.username,
    password: user.password ? hashPassword(user.password) : undefined
  }
  if (!user.username) delete user.password
  if (!user.password) delete user.password
  return user
}

const assembleUserResponse = (user) => {
  delete user.password
  return user
}

module.exports = {
  authenticateUser,
  getUser,
  saveUser,
  updateUser,
  // deleteUser,
  // checkUserAuthorization
}

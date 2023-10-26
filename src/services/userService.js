'use strict'
const { pbkdf2Sync } = require('crypto')
const { sign, verify } = require('jsonwebtoken')

const userDb = require('../db/userDb')
const errors = require('../common/errorMessages')
const constants = require('../common/constants')

const salt = process.env.SALT
const jwtSecret = process.env.JWT_SECRET

const hashPassword = password => pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')

const authenticateUser = async (username, password) => {
  const user = await getUserAdmin(username)
  if (user.status === constants.user.status.pending) throw errors.inactivatedUser
  if (user.status === constants.user.status.locked) throw errors.lockedUser
  if (hashPassword(password) !== user.password) {
    const wrongAttempts = user.loginData?.wrongAttempts
    if (wrongAttempts < constants.user.maxWrongLoginAttempts){
      const loginUpdate = {
        loginData: {
          wrongAttempts: wrongAttempts + 1,
          lastLoginAt: user.loginData.lastLoginAt
        }
      }
      await userDb.update(loginUpdate, username)
      throw errors.invalidPassword(constants.user.maxWrongLoginAttempts - wrongAttempts)
    }
    await changeStatus (user, constants.user.status.locked)
    throw errors.lockedUser
  }
  const loginUpdate = {
    loginData: {
      wrongAttempts: 0,
      lastLoginAt: new Date().getTime()
    }
  }
  await userDb.update(loginUpdate, username)
  return { token: sign({ username }, jwtSecret, { expiresIn: '24h', audience: 'zettelkasten'}) }
}

const getUser = async (username) => {
  const user = await getUserAdmin(username)
  return assembleUserResponse(user)
}

const createUser = async (body) => {
  const { username, password } = body
  if (!isValidPassword(password)) throw errors.invalidPasswordSchema
  const hashedPassword = hashPassword(password)
  body.password = hashedPassword
  const user = await userDb.getByUsername(username)
  const token = sign({ username }, jwtSecret, { expiresIn: '2h', audience: 'activeUser' })
  if (user) {
    if (user && user?.status === constants.user.status.pending) return { token }
    if (user && user?.status === constants.user.status.deleted) {
      const newStatus = constants.user.status.pending
      const updateData = assembleUpdate(body, user)
      updateData.lastPasswords = [hashedPassword]
      updateData.status = newStatus
      updateData.statusLog = [...user.statusLog, { status: newStatus, at: new Date().getTime()}]
      updateData.loginData = { wrongAttempts: 0 }
      await userDb.update(updateData, username)
      return { token }
    }
    throw errors.usernameNotAvailable
  }
  const assembledUser = assembleUser(body)
  await userDb.save(assembledUser)
  return { token }
}

const updateUser = async (username, body) => {
  const user = await getUserAdmin(username)
  const updateData = assembleUpdate(body, user)
  const updatedUser = await userDb.update(updateData, username)
  return assembleUserResponse(updatedUser)
}

const deleteUser = async (username) => {
  const user = await getUserAdmin(username)
  const deletedUser = await changeStatus (user, constants.user.status.deleted)
  return assembleUserResponse(deletedUser)
}

const activateUser = async (token) => {
  const { username } = checkTokenAndAudience(token, 'activeUser')
  const user = await getUserAdmin(username)
  if (user.status !== constants.user.status.pending) throw errors.alreadyActiveUser
  const activatedUser = await changeStatus (user, constants.user.status.active)
  return assembleUserResponse(activatedUser)
}

const getUnlockToken = async (username) =>{
  const user = await getUserAdmin(username)
  if (user.status !== constants.user.status.locked) throw errors.userNotLocked(username)
  return { token: sign({ username }, jwtSecret, { expiresIn: '2h', audience: 'unlockUser' }) }
}

const unlockUser = async (newPassword, token) => {
  const { username } = checkTokenAndAudience(token, 'unlockUser')
  const user = await getUserAdmin(username)
  const lastPasswords = user.lastPasswords
  if (!isValidPassword(newPassword)) throw errors.invalidPasswordSchema
  const hashedPassword = hashPassword(newPassword)
  if (lastPasswords.includes(hashedPassword)) throw errors.passwordAlreadyUsed
  lastPasswords.push(hashedPassword)
  const newStatus = constants.user.status.active
  const statusLog = user.statusLog
  statusLog.push({
    status: newStatus,
    at: new Date().getTime()
  })
  const passwordUpdate = {
    loginData: {
      wrongAttempts: 0,
      lastLoginAt: user.loginData.lastLoginAt
    },
    password: hashedPassword,
    lastPasswords,
    status: newStatus,
    statusLog
  }
  const updatedUser = await userDb.update(passwordUpdate, username)
  return assembleUserResponse(updatedUser)
}

const checkUserAuthorization = (event) => {
  const { authorization } = event.headers
  if (!authorization) throw errors.nonAuthorized
  const [type, token] = authorization.split(' ')
  if (type !== 'Bearer' || !token) throw errors.unsupportedAuthorization
  const decodedToken = checkTokenAndAudience(token, 'zettelkasten')
  return decodedToken
}

// PRIVATE FUNCTIONS

const getUserAdmin = async (username) => {
  const user = await userDb.getByUsername(username)
  if (!user || user.status === constants.user.status.deleted) throw errors.inexistentUsername(username)
  return user
}

const checkTokenAndAudience = (token, audience) => {
  try {
    return verify(token, jwtSecret, { audience })
  } catch (error) {
    throw errors.invalidToken
  }
}

const isValidPassword = (password) => {
  const hasTheCorrectLength = password.length >= constants.user.passwordPolicy.size
  const numberOfEspecialCharacters = countSpecialCharacters(password)
  const hasTheCorrectNumberOfEspecialCharacters = numberOfEspecialCharacters >= constants.user.passwordPolicy.especialCharacters
  if (hasTheCorrectLength && hasTheCorrectNumberOfEspecialCharacters) return true
  return false
}

const countSpecialCharacters = (text) => {
  const regex = /[!@#$%^&*()_+{}[\]|;:',.<>?]/g
  const specialChars = text.match(regex)
  return specialChars ? specialChars.length : 0
}

const assembleUser = (user) => {
  const assembledUser = {
    username: user.username,
    password: user.password ? hashPassword(user.password) : undefined,
    ...user
  }
  if (!assembledUser.username) delete assembledUser.username
  if (!assembledUser.password) delete assembledUser.password
  return assembledUser
}

const assembleUpdate = (updateFields, user) => {
  delete updateFields.password
  delete updateFields.username
  const changedData = assembleChangedFields(updateFields, user)
  const updateHistory = changedData ? (user.updateHistory ? [...user.updateHistory, changedData] : [changedData]) : undefined
  const assembledUpdate = {
    ...updateFields,
    password: updateFields.password ? hashPassword(updateFields.password) : undefined,
    updateHistory
  }
  return assembledUpdate
}

const assembleChangedFields = (newFields, oldFields) => {
  const assembledChangedFields = []
  for (const key in newFields) {
    if (oldFields.hasOwnProperty(key) && oldFields[key] !== newFields[key]) {
      assembledChangedFields.push({ [key]: oldFields[key] })
    }
  }
  if (assembledChangedFields.length < 1) return
  return { OldData: assembledChangedFields, at: new Date().getTime()}
}

const assembleUserResponse = (user) => {
  delete user.password
  return user
}

const changeStatus = (user, newStatus) => {
  const statusLog = user.statusLog
  statusLog.push({
    status: newStatus,
    at: new Date().getTime()
  })
  const updateData = {
    status: newStatus,
    statusLog
  }
  return userDb.update(updateData, user.username)
}

module.exports = {
  authenticateUser,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  getUnlockToken,
  unlockUser,
  checkUserAuthorization
}

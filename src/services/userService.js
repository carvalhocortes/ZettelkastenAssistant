'use strict'
const { pbkdf2Sync } = require('crypto')
const { sign } = require('jsonwebtoken')

const userDb = require('../db/userDb')
const errors = require('../common/errorMessages')
const constants = require('../common/constants')
const { checkTokenAndAudience } = require('../util/lambdaUtil')

const salt = process.env.SALT
const jwtSecret = process.env.JWT_SECRET

const hashPassword = password => pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')

const authenticateUser = async (email, password) => {
  const user = await getUserPrivate(email)
  if (user.status === constants.user.status.pending) throw errors.inactivatedUser
  if (user.status === constants.user.status.locked) throw errors.lockedUser
  if (user.status === constants.user.status.deleted) throw errors.inexistentEmail(email)
  if (hashPassword(password) !== user.password) {
    const wrongAttempts = user.loginData?.wrongAttempts + 1
    if (wrongAttempts < constants.user.maxWrongLoginAttempts){
      const loginUpdate = {
        loginData: {
          wrongAttempts,
          lastLoginAt: user.loginData.lastLoginAt
        }
      }
      await userDb.update(loginUpdate, email)
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
  await userDb.update(loginUpdate, email)
  return { token: sign({ email, permission: user.permission }, jwtSecret, { expiresIn: '24h', audience: 'zettelkasten'}) }
}

const getUser = async (email) => {
  const user = await getUserPrivate(email)
  return assembleUserResponse(user)
}

const createUser = async (body) => {
  const { email, password } = body
  if (!isValidEmail(email)) throw errors.invalidEmailSchema
  if (!isValidPassword(password)) throw errors.invalidPasswordSchema
  const hashedPassword = hashPassword(password)
  body.password = hashedPassword
  const user = await userDb.getByEmail(email)
  const token = sign({ email }, jwtSecret, { expiresIn: '24h', audience: 'activeUser' })
  if (user) {
    if (user && user?.status === constants.user.status.deleted) {
      const newStatus = constants.user.status.pending
      const updateData = assembleUpdate(assembleUser(body, body?.permission), user)
      updateData.status = newStatus
      updateData.statusLog = [...user.statusLog, { status: newStatus, at: new Date().getTime()}]
      updateData.loginData = { wrongAttempts: 0 }
      const fieldsToDelete = user
      await userDb.update(updateData, email, fieldsToDelete)
      return { token }
    }
    throw errors.emailNotAvailable
  }
  const assembledUser = assembleUser(body, body?.permission)
  await userDb.save(assembledUser)
  return { token }
}

const updateUser = async (email, body) => {
  const user = await getUserPrivate(email)
  if (body.password) {
    if (!isValidPassword(body.password)) throw errors.invalidPasswordSchema
    const hashedPassword = hashPassword(body.password)
    const lastPassword = user.password
    const lastPasswords = user.lastPasswords ? { ...user.lastPasswords, lastPassword } : [lastPassword]
    if (lastPasswords?.includes(hashedPassword)) throw errors.passwordAlreadyUsed
    body = {
      ...body,
      password: hashPassword,
      lastPasswords
    }
  }
  const updateData = assembleUpdate(body, user)
  const updatedUser = await userDb.update(updateData, email)
  return assembleUserResponse(updatedUser)
}

const deleteUser = async (email) => {
  const user = await getUserPrivate(email)
  const deletedUser = await changeStatus (user, constants.user.status.deleted)
  return assembleUserResponse(deletedUser)
}

const activateUser = async (token) => {
  const { email } = checkTokenAndAudience(token, 'activeUser')
  const user = await getUserPrivate(email)
  if (user.status !== constants.user.status.pending) throw errors.alreadyActiveUser
  const activatedUser = await changeStatus (user, constants.user.status.active)
  return assembleUserResponse(activatedUser)
}

const getUnlockToken = async (email) =>{
  const user = await getUserPrivate(email)
  if (user.status === constants.user.status.pending) return { token: sign({ email }, jwtSecret, { expiresIn: '24h', audience: 'activeUser' }) }
  if (user.status === constants.user.status.locked) return { token: sign({ email }, jwtSecret, { expiresIn: '2h', audience: 'unlockUser' }) }
  throw errors.userNotLocked(email)
}

const unlockUser = async (newPassword, token) => {
  const { email } = checkTokenAndAudience(token, 'unlockUser')
  const user = await getUserPrivate(email)
  if (!isValidPassword(newPassword)) throw errors.invalidPasswordSchema
  const hashedPassword = hashPassword(newPassword)
  const lastPassword = user.password
  const lastPasswords = user.lastPasswords ? { ...user.lastPasswords, lastPassword } : [lastPassword]
  if (lastPasswords?.includes(hashedPassword)) throw errors.passwordAlreadyUsed
  const newStatus = constants.user.status.active
  const statusLog = user.statusLog
  statusLog.push({
    status: newStatus,
    at: new Date().getTime()
  })
  const passwordUpdate = {
    loginData: {
      wrongAttempts: 0,
      lastLoginAt: user.loginData?.lastLoginAt
    },
    password: hashedPassword,
    lastPasswords,
    status: newStatus,
    statusLog
  }
  const updatedUser = await userDb.update(passwordUpdate, email)
  return assembleUserResponse(updatedUser)
}



// PRIVATE FUNCTIONS

const getUserPrivate = async (email) => {
  const user = await userDb.getByEmail(email)
  if (!user || user.status === constants.user.status.deleted) throw errors.inexistentEmail(email)
  return user
}



const isValidPassword = (password) => {
  const especialCharacters = "!@#$%^&*()_+{}[\]|;:',.<>?"
  const numberOfRequiredCharacters = constants.user.passwordPolicy.size
  const expression = `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[${especialCharacters}])[A-Za-z\d${especialCharacters}]{{${numberOfRequiredCharacters}},}$`
  const validPasswordRegex = new RegExp(expression, 'g');
  return validPasswordRegex.test(password)
}

const isValidEmail = (email) => {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return regex.test(email)
}

const assembleUser = (user, permission = constants.user.permissions.user) => {
  return {
    email: user.email,
    password: user.password,
    birthDate: user.birthDate,
    avatar: user.avatar,
    city: user.city,
    country: user.country,
    permission
    }
}

const assembleUpdate = (updateFields, user) => {
  delete updateFields.email
  const changedData = assembleChangedFields(updateFields, user)
  const updateHistory = changedData ? (user.updateHistory ? [...user.updateHistory, changedData] : [changedData]) : undefined
  return {
    ...updateFields,
    updateHistory
  }
}

const assembleChangedFields = (newFields, oldFields) => {
  const assembledChangedFields = {}
  for (const key in newFields) {
    if (oldFields.hasOwnProperty(key) && oldFields[key] !== newFields[key]) {
      assembledChangedFields[key] = oldFields[key]
    }
  }
  if (Object.keys(assembledChangedFields).length < 1) return
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
  return userDb.update(updateData, user.email)
}

module.exports = {
  authenticateUser,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  getUnlockToken,
  unlockUser
}

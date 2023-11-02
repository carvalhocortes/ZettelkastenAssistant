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
  checkUserIsAuthenticatable(user)
  await checkPassword(user, password)
  return doLogin(user)
}

const getUser = async (email) => {
  const user = await getUserPrivate(email)
  return assembleUserResponse(user)
}

const createUser = async (body) => {
  validadeCreateUserData(body)
  body.password = hashPassword(body.password)
  const user = await userDb.getByEmail(body.email)
  if (!user) return createNewUser(body)
  if (user?.status === constants.user.status.deleted) return createReturningUser (user, body)
  throw errors.emailNotAvailable
}

const updateUser = async (email, body) => {
  const user = await getUserPrivate(email)
  if (body.password) body = checkAndAddBodyPassword(user, body)
  if (!isValidBirthDate(body)) throw errors.invalidBirthDateSchema
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
  if (user.status !== constants.user.status.pending) throw errors.nonActivatableUser
  const activatedUser = await changeStatus (user, constants.user.status.active)
  return assembleUserResponse(activatedUser)
}

const getUnlockToken = async (email) =>{
  const user = await getUserPrivate(email)
  if (user.status === constants.user.status.pending) return { token: sign({ email }, jwtSecret, { expiresIn: '24h', audience: 'activeUser' }) }
  if (user.status === constants.user.status.locked) return { token: sign({ email }, jwtSecret, { expiresIn: '2h', audience: 'unlockUser' }) }
  throw errors.userDontNeedToken(email)
}

const unlockUser = async (newPassword, token) => {
  const { email } = checkTokenAndAudience(token, 'unlockUser')
  const user = await getUserPrivate(email)
  if (!isValidPassword(newPassword)) throw errors.invalidPasswordSchema
  const { hashedPassword, lastPasswords} = checkPasswordAlreadyUsed(user, newPassword)
  const newStatus = constants.user.status.active
  const passwordUpdate = {
    loginRecord: assembleLoginRecord(0, user.loginRecord?.lastLoginAt),
    password: hashedPassword,
    lastPasswords,
    status: newStatus,
    statusLog: [...user.statusLog, assembleStatusLog(newStatus)]
  }
  const updatedUser = await userDb.update(passwordUpdate, email)
  return assembleUserResponse(updatedUser)
}

// PRIVATE FUNCTIONS

const updateLogin = async (user, wrongAttempts, lastLoginAt) => {
  const loginRecord = assembleLoginRecord(wrongAttempts, lastLoginAt)
  await userDb.update({ loginRecord }, user.email)
}

const assembleLoginRecord = (wrongAttempts, lastLoginAt) => ({
  wrongAttempts,
  lastLoginAt
})

const checkPassword = async (user, password) => {
  if (hashPassword(password) !== user.password) {
    const wrongAttempts = user.loginRecord?.wrongAttempts + 1
    if (wrongAttempts < constants.user.maxWrongLoginAttempts){
      await updateLogin(user, wrongAttempts, user.loginRecord.lastLoginAt)
      throw errors.invalidPassword(constants.user.maxWrongLoginAttempts - wrongAttempts)
    }
    await changeStatus (user, constants.user.status.locked)
    throw errors.lockedUser
  }
}

const doLogin = async (user) => {
  await updateLogin(user, 0, new Date().getTime())
  return { token: sign({ email: user.email , permission: user.permission }, jwtSecret, { expiresIn: '24h', audience: 'zettelkasten'}) }
}

const checkUserIsAuthenticatable = (user) => {
  if (user.status === constants.user.status.pending) throw errors.inactivatedUser
  if (user.status === constants.user.status.locked) throw errors.lockedUser
  if (user.status === constants.user.status.deleted) throw errors.inexistentEmail(email)
}

const getUserPrivate = async (email) => {
  const user = await userDb.getByEmail(email)
  if (!user || user.status === constants.user.status.deleted) throw errors.inexistentEmail(email)
  return user
}

const isValidBirthDate = ({ birthDate }) => {
  if (birthDate) {
    const regex = /(0[1-9]|1[1,2])(\/|-)(0[1-9]|[12][0-9]|3[01])(\/|-)(19|20)\d{2}/
    return regex.test(birthDate)
  }
  return true
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

const assembleUpdate = (updateFields, originalFields) => {
  delete updateFields.email
  const changedData = assembleChangedFields(updateFields, originalFields)
  const updateHistory = changedData ? (originalFields.updateHistory ? [...originalFields.updateHistory, changedData] : [changedData]) : undefined
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
  const updateData = {
    status: newStatus,
    statusLog: [...user.statusLog, assembleStatusLog(newStatus)]
  }
  return userDb.update(updateData, user.email)
}

const assembleStatusLog = (newStatus) => ({
  status: newStatus,
  at: new Date().getTime()
})

const createNewUser = async (body) => {
  await userDb.save(assembleUser(body, body?.permission))
  return { token: sign({ email: body.email }, jwtSecret, { expiresIn: '24h', audience: 'activeUser' }) }
}

const createReturningUser = async (user, body) => {
  const newStatus = constants.user.status.pending
  const updateData = assembleUpdate(assembleUser(body, body?.permission), user)
  updateData.status = newStatus
  updateData.statusLog = [...user.statusLog, assembleStatusLog(newStatus)]
  updateData.loginRecord = { wrongAttempts: 0 }
  await userDb.update(updateData, user.email, user)
  return { token: sign({ email: user.email }, jwtSecret, { expiresIn: '24h', audience: 'activeUser' }) }
}

const validadeCreateUserData = (body) => {
  if (!isValidEmail(body.email)) throw errors.invalidEmailSchema
  if (!isValidPassword(body.password)) throw errors.invalidPasswordSchema
  if (!isValidBirthDate(body)) throw errors.invalidBirthDateSchema
}

const assembleLastPasswords = (user) => {
  const lastPassword = user.password
  return user.lastPasswords ? { ...user.lastPasswords, lastPassword } : [lastPassword]
}

const updateBodyWithNewPassword = (body, hashedPassword, lastPasswords) => {
  body.password = hashedPassword
  body.lastPasswords = lastPasswords
  return body
}

const checkAndAddBodyPassword = (user, body) => {
  if (!isValidPassword(body.password)) throw errors.invalidPasswordSchema
  const { hashedPassword, lastPasswords} = checkPasswordAlreadyUsed(user, body.password)
  return updateBodyWithNewPassword(body, hashedPassword, lastPasswords)
}

const checkPasswordAlreadyUsed = (user, password) => {
  const hashedPassword = hashPassword(password)
  const lastPasswords = assembleLastPasswords(user)
  if (lastPasswords?.includes(hashedPassword)) throw errors.passwordAlreadyUsed
  return { hashedPassword, lastPasswords }
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

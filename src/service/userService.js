'use strict'
const { pbkdf2Sync } = require('crypto')
const { sign } = require('jsonwebtoken')

const userDb = require('../db/userDb')
const errors = require('../common/userErrors')
const constants = require('../common/constants')
const { checkTokenAndAudience } = require('../helper/lambdaHelper')

const salt = process.env.SALT
const jwtSecret = process.env.JWT_SECRET

const hashPassword = password => pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')

const authenticateUser = async ({ email, password }) => {
  const user = await getUser(email)
  checkUserIsAuthenticatable(user)
  await checkPassword(user, password)
  return doLogin(user)
}

const getUser = async (email) => {
  const user = await userDb.getByEmail(email)
  if (!user || user.status === constants.user.status.deleted) throw errors.inexistentEmail(email)
  return user
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
  const user = await getUser(email)
  if (body.password) body = checkAndAddBodyPassword(user, body)
  if (!isValidBirthday(body)) throw errors.invalidBirthdaySchema
  const updateData = assembleUpdate(body, user)
  return userDb.update(updateData, email)
}

const deleteUser = async (email) => {
  const user = await getUser(email)
  return changeStatus (user, constants.user.status.deleted)
}

const activateUser = async (token) => {
  const { email } = checkTokenAndAudience(token, 'activeUser')
  const user = await getUser(email)
  if (user.status !== constants.user.status.pending) throw errors.nonActivatableUser
  const activatedUser = await changeStatus(user, constants.user.status.active)
  const authToken = sign({ email: user.email , permission: user.permission }, jwtSecret, { expiresIn: '24h', audience: 'zettelkasten'})
  return { user: activatedUser, token: authToken }
}

const getUnlockToken = async (email) =>{
  const user = await getUser(email)
  if (user.status === constants.user.status.pending) return getToken(email, '24h', 'activeUser')
  if (user.status === constants.user.status.locked) return getToken(email, '2h', 'unlockUser')
  throw errors.userDontNeedToken(email)
}

const unlockUser = async (newPassword, token) => {
  const { email } = checkTokenAndAudience(token, 'unlockUser')
  const user = await getUser(email)
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
  return userDb.update(passwordUpdate, email)
}

// PRIVATE FUNCTIONS

const getToken = (email, expiresIn, audience) => ({
  token: sign({ email }, jwtSecret, { expiresIn, audience })
})

const updateLogin = (user, wrongAttempts, lastLoginAt) =>
  userDb.update({ loginRecord: assembleLoginRecord(wrongAttempts, lastLoginAt) }, user.email)

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
  const token = sign({ email: user.email , permission: user.permission }, jwtSecret, { expiresIn: '24h', audience: 'zettelkasten'})
  return { user, token }
}

const checkUserIsAuthenticatable = (user) => {
  if (user.status === constants.user.status.pending) throw errors.inactivatedUser
  if (user.status === constants.user.status.locked) throw errors.lockedUser
  if (user.status === constants.user.status.deleted) throw errors.inexistentEmail(email)
}

const isValidBirthday = ({ birthday }) => {
  if (birthday) {
    const regex = /(0[1-9]|1[1,2])(\/|-)(0[1-9]|[12][0-9]|3[01])(\/|-)(19|20)\d{2}/
    return regex.test(birthday)
  }
  return true
}

const isValidPassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]|;:',.<>?])[A-Za-z\d!@#$%^&*()_+{}[\]|;:',.<>?]{6,}$/
  return regex.test(password)
}

const isValidEmail = (email) => {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return regex.test(email)
}

const assembleUser = (user, permission = constants.user.permissions.user) => {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    birthday: user.birthday,
    avatar: user.avatar,
    city: user.city,
    country: user.country,
    permission
    }
}

const assembleUpdate = (updateFields, originalFields) => {
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
  return getToken(body.email, '24h', 'activeUser')
}

const createReturningUser = async (user, body) => {
  const newStatus = constants.user.status.pending
  const updateData = assembleUpdate(assembleUser(body, body?.permission), user)
  updateData.status = newStatus
  updateData.statusLog = [...user.statusLog, assembleStatusLog(newStatus)]
  updateData.loginRecord = { wrongAttempts: 0 }
  const keysToDelete = getKeysToDelete(updateData)
  await userDb.update(updateData, user.email, keysToDelete)
  return getToken(body.email, '24h', 'activeUser')
}

const validadeCreateUserData = (body) => {
  if (!isValidEmail(body.email)) throw errors.invalidEmailSchema
  if (!isValidPassword(body.password)) throw errors.invalidPasswordSchema
  if (!isValidBirthday(body)) throw errors.invalidBirthdaySchema
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

const getKeysToDelete = (newUserData) => {
  const keysToDelete = []
  for (const key in newUserData) {
    if (newUserData[key] === undefined || newUserData[key] === null) keysToDelete.push(key)
  }
  return keysToDelete
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

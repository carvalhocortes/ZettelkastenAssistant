const { success, error, processEvent } = require('../util/lambdaUtil')
const userValidator = require('../validator/userValidator')
const userService = require('../services/userService')
const constants = require('../common/constants')

const authenticate = async (event) => {
  try {
    const processedEvent = processEvent(event)
    const { email, password } = userValidator.validateLogin(processedEvent)
    const token = await userService.authenticateUser(email, password)
    return success(token)
  } catch (err) {
    return error(err)
  }
}

const createUser = async (event) => {
  try {
    const processedEvent = processEvent(event)
    const body = userValidator.validateCreateUser(processedEvent)
    const tokenNewUser = await userService.createUser(body)
    return success(tokenNewUser, 201)
  } catch (err) {
    return error(err)
  }
}

const getUser = async (event) => {
  try {
    const processedEvent = processEvent(event, 'zettelkasten')
    const isAdmin = processedEvent.session?.permission === constants.user.permissions.admin
    const email = isAdmin ? (userValidator.validateGetUser(processedEvent)).email : processedEvent.session.email
    const user = await userService.getUser(email)
    return success(user)
  } catch (err) {
    return error(err)
  }
}

const updateUser = async (event) => {
  try {
    const processedEvent = processEvent(event, 'zettelkasten')
    const isAdmin = processedEvent.session?.permission === constants.user.permissions.admin
    const email = isAdmin ? (userValidator.validateUpdateUser(processedEvent)).pathParameters.email : processedEvent.session.email
    const updatedUser = await userService.updateUser(email, processedEvent.body)
    return success(updatedUser)
  } catch (err) {
    return error(err)
  }
}

const deleteUser = async (event) => {
  try {
    const processedEvent = processEvent(event, 'zettelkasten')
    const isAdmin = processedEvent.session?.permission === constants.user.permissions.admin
    const email = isAdmin ? (userValidator.validateDeleteUser(processedEvent)).email : processedEvent.session.email
    const deletedUser = await userService.deleteUser(email)
    return success(deletedUser)
  } catch (err) {
    return error(err)
  }
}

const activateUser = async (event) => {
  try {
    const processedEvent = processEvent(event)
    const { token } = userValidator.validateActivateUser(processedEvent)
    const unlockedUser = await userService.activateUser(token)
    return success(unlockedUser)
  } catch (err) {
    return error(err)
  }
}

const getUnlockToken = async (event) => {
  try {
    const processedEvent = processEvent(event)
    const { email } = userValidator.validateGetUser(processedEvent)
    const token = await userService.getUnlockToken(email)
    return success(token)
  } catch (err) {
    return error(err)
  }
}

const unlockUser = async (event) => {
  try {
    const processedEvent = processEvent(event)
    const { password, token } = userValidator.validateUnlockUser(processedEvent)
    const unlockedUser = await userService.unlockUser(password, token)
    return success(unlockedUser)
  } catch (err) {
    return error(err)
  }
}


module.exports = {
  authenticate,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  activateUser,
  getUnlockToken,
  unlockUser
}

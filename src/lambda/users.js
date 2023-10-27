const { success, error, sanitizeEvent } = require('../util/lambdaUtil')
const userValidator = require('../validator/userValidator')
const userService = require('../services/userService')

const authenticate = async (event) => {
  try {
    const processedEvent = sanitizeEvent(event)
    const { email, password } = userValidator.validateLogin(processedEvent)
    const token = await userService.authenticateUser(email, password)
    return success(token)
  } catch (err) {
    return error(err)
  }
}

const createUser = async (event) => {
  try {
    const processedEvent = sanitizeEvent(event)
    const body = userValidator.validateCreateUser(processedEvent)
    const tokenNewUser = await userService.createUser(body)
    return success(tokenNewUser)
  } catch (err) {
    return error(err)
  }
}

const getUser = async (event) => {
  try {
    const processedEvent = sanitizeEvent(event)
    const { email } = userValidator.validateGetUser(processedEvent)
    const user = await userService.getUser(email)
    return success(user)
  } catch (err) {
    return error(err)
  }
}

const updateUser = async (event) => {
  try {
    const processedEvent = sanitizeEvent(event)
    const { pathParameters, body } = userValidator.validateUpdateUser(processedEvent)
    const updatedUser = await userService.updateUser(pathParameters.email, body)
    return success(updatedUser)
  } catch (err) {
    return error(err)
  }
}

const deleteUser = async (event) => {
  try {
    const processedEvent = sanitizeEvent(event)
    const { email } = userValidator.validateDeleteUser(processedEvent)
    const deletedUser = await userService.deleteUser(email)
    return success(deletedUser)
  } catch (err) {
    return error(err)
  }
}

const activateUser = async (event) => {
  try {
    const processedEvent = sanitizeEvent(event)
    const { token } = userValidator.validateActivateUser(processedEvent)
    const unlockedUser = await userService.activateUser(token)
    return success(unlockedUser)
  } catch (err) {
    return error(err)
  }
}

const getUnlockToken = async (event) => {
  try {
    const processedEvent = sanitizeEvent(event)
    const { email } = userValidator.validateGetUser(processedEvent)
    const token = await userService.getUnlockToken(email)
    return success(token)
  } catch (err) {
    return error(err)
  }
}

const unlockUser = async (event) => {
  try {
    const processedEvent = sanitizeEvent(event)
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

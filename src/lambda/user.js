const { success, error } = require('../util/lambdaUtil')
const { validateLogin, validateCreateUser, validateGetUser } = require('../validator/userValidator')
const userService = require('../services/userService')

const authenticate = async (event) => {
  try {
    const { username, password } = validateLogin(event)
    const token = await userService.makeLogin(username, password)
    return success(token)
  } catch (err) {
    return error(err)
  }
}

const createUser = async (event) => {
  try {
    const body = validateCreateUser(event)
    const user = await userService.createNewUser(body)
    return success(user)
  } catch (err) {
    return error(err)
  }
}

const getUser = async (event) => {
  try {
    const { id } = validateGetUser(event)
    const user = await userService.getUser(id)
    return success(user)
  } catch (err) {
    return error(err)
  }
}

module.exports = {
  authenticate,
  createUser,
  getUser
}
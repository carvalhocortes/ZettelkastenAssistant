const { success, error, sanitizeEvent } = require('../util/lambdaUtil')
const userValidator = require('../validator/userValidator')
const userService = require('../services/userService')

const authenticate = async (event) => {
  try {
    event = sanitizeEvent(event)
    const { username, password } = userValidator.validateLogin(event)
    const token = await userService.authenticateUser(username, password)
    return success(token)
  } catch (err) {
    return error(err)
  }
}

const createUser = async (event) => {
  try {
    event = sanitizeEvent(event)
    const body = userValidator.validateCreateUser(event)
    const user = await userService.saveUser(body)
    return success(user)
  } catch (err) {
    return error(err)
  }
}

const getUser = async (event) => {
  try {
    event = sanitizeEvent(event)
    const { username } = userValidator.validateGetUser(event)
    const user = await userService.getUser(username)
    return success(user)
  } catch (err) {
    return error(err)
  }
}

const updateUser = async (event) => {
  try {
    event = sanitizeEvent(event)
    const { pathParameters, body } = userValidator.validateUpdateUser(event)
    const updatedUser = await userService.updateUser(pathParameters, body)
    return success(updatedUser)
  } catch (err) {
    return error(err)
  }
}

// const deleteUser = async (event) => {
//   try {
//     event = sanitizeEvent(event)
//     return success(user)
//   } catch (err) {
//     return error(err)
//   }
// }

// const unlockUser = async (event) => {
//   try {
//     event = sanitizeEvent(event)

//     return success(user)
//   } catch (err) {
//     return error(err)
//   }
// }

// const changeUserCredentials = async (event) => {
//   try {
//     event = sanitizeEvent(event)
//     return success(user)
//   } catch (err) {
//     return error(err)
//   }
// }


module.exports = {
  authenticate,
  createUser,
  getUser,
  updateUser,
  // deleteUser,
  // unlockUser,
  // changeUserCredentials
}

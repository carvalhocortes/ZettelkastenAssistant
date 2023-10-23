const { success, error } = require('../util/lambdaUtil')
const { validateLogin, validateCreateUser, validateGetUser } = require('../validator/userValidator')
const userService = require('../services/userService')

const authenticate = async (event) => {
  try {
    console.log('entrou no lambda')
    const { username, password } = validateLogin(event)
    const token = await userService.authenticateUser(username, password)
    return success(token)
  } catch (err) {
    return error(err)
  }
}

// const createUser = async (event) => {
//   try {
//     const body = validateCreateUser(event)
//     const user = await userService.createNewUser(body)
//     return success(user)
//   } catch (err) {
//     return error(err)
//   }
// }

// const getUser = async (event) => {
//   try {
//     const { id } = validateGetUser(event)
//     const user = await userService.getUser(id)
//     return success(user)
//   } catch (err) {
//     return error(err)
//   }
// }

// const updateUser = async (event) => {
//   try {

//   } catch (error) {

//   }
// }

// const deleteUser = async (event) => {
//   try {

//   } catch (error) {

//   }
// }

// const unlockUser = async (event) => {
//   try {

//   } catch (error) {

//   }
// }

// const changeUserCredentials = async (event) => {
//   try {

//   } catch (error) {

//   }
// }


module.exports = {
  authenticate,
  // createUser,
  // getUser,
  // updateUser,
  // deleteUser,
  // unlockUser,
  // changeUserCredentials
}

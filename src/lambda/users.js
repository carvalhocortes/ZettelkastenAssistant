'use strict'

const { success, error, processEvent } = require('../util/lambdaUtil')
const userValidator = require('../validator/userValidator')
const userService = require('../services/userService')
const constants = require('../common/constants')

const authenticate = async (event) => {
  return processEvent(event)
    .then(event => userValidator.validateLogin(event))
    .then(body => userService.authenticateUser(body))
    .then(response => success({ user: assembleUserResponse(response.user), token: response.token }))
    .catch(err => error(err))
}

const createUser = async (event) => {
  return processEvent(event)
    .then(event => userValidator.validateCreateUser(event))
    .then(body => userService.createUser(body))
    .then(tokenNewUser => success(tokenNewUser, 201))
    .catch(err => error(err))
}

const getUser = async (event) => {
  return processEvent(event, 'zettelkasten')
    .then(async event => {
      const isAdmin = event.session?.permission === constants.user.permissions.admin
      return isAdmin ? await userValidator.validateGetUser(event) : event.session.email
    })
    .then(email => userService.getUser(email))
    .then(user => success(assembleUserResponse(user)))
    .catch(err => error(err))
}

const updateUser = async (event) => {
  return processEvent(event, 'zettelkasten')
    .then(async event => {
      const isAdmin = event.session?.permission === constants.user.permissions.admin
      return isAdmin ? (await userValidator.validateUpdateUser(event)).pathParameters.email : event.session.email
    })
    .then(email => userService.updateUser(email, event.body))
    .then(user => success(assembleUserResponse(user)))
    .catch(err => error(err))
}

const deleteUser = async (event) => {
  return processEvent(event, 'zettelkasten')
    .then(async event => {
      const isAdmin = event.session?.permission === constants.user.permissions.admin
      return isAdmin ? (await userValidator.validateDeleteUser(event)).email : event.session.email
    })
    .then(email => userService.deleteUser(email))
    .then(user => success(assembleUserResponse(user)))
    .catch(err => error(err))
}

const activateUser = async (event) => {
  return processEvent(event)
    .then(event => userValidator.validateActivateUser(event))
    .then(token => userService.activateUser(token))
    .then(response => success({ user: assembleUserResponse(response.user), token: response.token }))
    .catch(err => error(err))
}

const getUnlockToken = async (event) => {
  return processEvent(event)
    .then(event => userValidator.validateGetUser(event))
    .then(email => userService.getUnlockToken(email))
    .then(response => success(response))
    .catch(err => error(err))
}

const unlockUser = async (event) => {
  return processEvent(event)
    .then(event => userValidator.validateUnlockUser(event))
    .then(body => userService.unlockUser(body.password, body.token))
    .then(user => success(assembleUserResponse(user)))
    .catch(err => error(err))
}

// PRIVATE FUNCTIONS

const assembleUserResponse = user => ({
  name: user.name,
  email: user.email,
  birthday: user.birthday,
  city: user.city,
  country: user.country,
  avatar: user.avatar,
  status: user.status
})

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

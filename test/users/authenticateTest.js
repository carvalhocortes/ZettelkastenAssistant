const { buildEvent, uniqueEmail, buildUser, testSuccess, testRequired, testError } = require('../utils/testUtils')
const userDb = require('../../src/db/userDb')

const activateUserFunc = require('../../src/lambda/users').activateUser
const createUserFunc = require('../../src/lambda/users').createUser
const authUserFunc = require('../../src/lambda/users').authenticate

const credentials = (user) => ({
  email: user.email,
  password: user.password
})

describe('Authenticate users tests', () => {
  it('Should validate the input', async () => {
    const authUserEvent = buildEvent(credentials(buildUser()))
    await testRequired(authUserFunc, authUserEvent, 'body', errorsNumber.requiredField)
    await testRequired(authUserFunc, authUserEvent, 'body.email', errorsNumber.requiredField)
    await testRequired(authUserFunc, authUserEvent, 'body.password', errorsNumber.requiredField)
  })
  it('Should not authenticate user activated', async () => {
    const user = buildUser()
    const createUserEvent = buildEvent(user)
    await testSuccess(createUserFunc, createUserEvent, 201)
    const authUserEvent = buildEvent(credentials(user))
    await testError(authUserFunc, authUserEvent, 401, errorsNumber.inactivatedUser)
  })
  it('Should not authenticate locked user', async () => {
    const user = buildUser()
    const createUserEvent = buildEvent(user)
    await testSuccess(createUserFunc, createUserEvent, 201)
    await userDb.update({ status: 'Locked'}, user.email)
    const authUserEvent = buildEvent(credentials(user))
    await testError(authUserFunc, authUserEvent, 401, errorsNumber.lockedUser)

  })
  it('Should not authenticate deleted user', async () => {
    const user = buildUser()
    const createUserEvent = buildEvent(user)
    await testSuccess(createUserFunc, createUserEvent, 201)
    await userDb.update({ status: 'Deleted'}, user.email)
    const authUserEvent = buildEvent(credentials(user))
    await testError(authUserFunc, authUserEvent, 404, errorsNumber.inexistentEmail)
  })
  it('Should not authenticate user with a unknown email', async () => {
    const credentials = {
      email: 'unknown@email.com',
      password: 'Any Password',
    }
    const authUserEvent = buildEvent(credentials)
    await testError(authUserFunc, authUserEvent, 404, errorsNumber.inexistentEmail)
  })
  it('Should not authenticate user with wrong password and increase the wrong attempts counter', async () => {
    let user = buildUser()
    const createUserEvent = buildEvent(user)
    const { token } = await testSuccess(createUserFunc, createUserEvent, 201)
    const activateUserEvent = buildEvent(undefined, { token })
    await testSuccess(activateUserFunc, activateUserEvent, 200)
    user.password = 'wrong password'
    const authUserEvent = buildEvent(credentials(user))
    await testError(authUserFunc, authUserEvent, 401, errorsNumber.invalidPassword)
    let notAuthorizedUser = await userDb.getByEmail(user.email)
    notAuthorizedUser.should.have.property('loginRecord')
    notAuthorizedUser.loginRecord.should.have.property('wrongAttempts').which.is.equal(1)
    await testError(authUserFunc, authUserEvent, 401, errorsNumber.invalidPassword)
    notAuthorizedUser = await userDb.getByEmail(user.email)
    notAuthorizedUser.loginRecord.should.have.property('wrongAttempts').which.is.equal(2)
  })
  it('Should lock the user after 5 wrong attempts', async () => {
    let user = buildUser()
    const createUserEvent = buildEvent(user)
    const { token } = await testSuccess(createUserFunc, createUserEvent, 201)
    const activateUserEvent = buildEvent(undefined, { token })
    await testSuccess(activateUserFunc, activateUserEvent, 200)
    user.password = 'wrong password'
    const authUserEvent = buildEvent(credentials(user))
    await testError(authUserFunc, authUserEvent, 401, errorsNumber.invalidPassword)
    await testError(authUserFunc, authUserEvent, 401, errorsNumber.invalidPassword)
    await testError(authUserFunc, authUserEvent, 401, errorsNumber.invalidPassword)
    await testError(authUserFunc, authUserEvent, 401, errorsNumber.invalidPassword)
    await testError(authUserFunc, authUserEvent, 401, errorsNumber.lockedUser)
    const notAuthorizedUser = await userDb.getByEmail(user.email)
    notAuthorizedUser.should.have.property('status').which.is.equal('Locked')
    })
  it('Should eliminate wrong attempts data and authenticate the user', async () => {
    let user = buildUser()
    const correctPassword = user.password
    const createUserEvent = buildEvent(user)
    const { token } = await testSuccess(createUserFunc, createUserEvent, 201)
    const activateUserEvent = buildEvent(undefined, { token })
    await testSuccess(activateUserFunc, activateUserEvent, 200)
    user.password = 'wrong password'
    let authUserEvent = buildEvent(credentials(user))
    await testError(authUserFunc, authUserEvent, 401, errorsNumber.invalidPassword)
    user.password = correctPassword
    authUserEvent = buildEvent(credentials(user))
    const response = await testSuccess(authUserFunc, authUserEvent, 200)
    response.should.have.property('token').be.a.String()
    response.token.should.be.ok()
    const authorizedUser = await userDb.getByEmail(user.email)
    authorizedUser.should.have.property('loginRecord')
    authorizedUser.loginRecord.should.have.property('wrongAttempts').which.is.equal(0)
    authorizedUser.loginRecord.should.have.property('lastLoginAt')
  })
})

const errorsNumber = {
  requiredField: 0,
  invalidPassword: 1,
  inexistentEmail: 5,
  inactivatedUser: 8,
  lockedUser: 9,
}

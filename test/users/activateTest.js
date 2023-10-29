const { buildEvent, uniqueEmail, buildUser, testSuccess, testRequired, testError } = require('../utils/testUtils')

const activateUserFunc = require('../../src/lambda/users').activateUser
const createUserFunc = require('../../src/lambda/users').createUser

describe('Activate users tests', async () => {
  before(async () => {
  })
  it('Should validate the input', async () => {
    const user = buildUser(uniqueEmail())
    const createUserEvent = buildEvent(user)
    const { token } = await testSuccess(createUserFunc, createUserEvent, 201)
    const activateUserEvent = buildEvent(undefined, { token })
    await testRequired(activateUserFunc, activateUserEvent, 'pathParameters', errorsNumber.requiredField)
    await testRequired(activateUserFunc, activateUserEvent, 'pathParameters.token', errorsNumber.requiredField)
  })
  it('Should activate user', async () => {
    const user = buildUser(uniqueEmail())
    const createUserEvent = buildEvent(user)
    const { token } = await testSuccess(createUserFunc, createUserEvent, 201)
    const activateUserEvent = buildEvent(undefined, { token })
    await testSuccess(activateUserFunc, activateUserEvent, 200)
  })
  it('Should not activate user with invalid token', async () => {
    const token = 'invalid token'
    const activateUserEvent = buildEvent(undefined, { token })
    await testError(activateUserFunc, activateUserEvent, 401, errorsNumber.invalidToken)
  })
})

const errorsNumber = {
  requiredField: 0,
  invalidToken: 4
}

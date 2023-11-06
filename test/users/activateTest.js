const { buildEvent, buildUser, testSuccess, testRequired, testError } = require('../helper/testHelper')

const createUserFunc = require('../../src/lambda/users').createUser
const activateUserFunc = require('../../src/lambda/users').activateUser

describe('Activate users tests', async () => {
  it('Should validate the input', async () => {
    const activateUserEvent = buildEvent(undefined, { token: 'any Token' })
    await testRequired(activateUserFunc, activateUserEvent, 'pathParameters', errorsNumber.requiredField)
    await testRequired(activateUserFunc, activateUserEvent, 'pathParameters.token', errorsNumber.requiredField)
  })
  it('Should activate user', async () => {
    const user = buildUser()
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
  requiredField: 1001,
  invalidToken: 1002
}

const { buildEvent, buildUser, testSuccess, testRequired, testError } = require('../utils/testUtils')

const getUserFunc = require('../../src/lambda/users').getUser

describe('Get users tests', () => {
  it('Should validate the input', async() => {
    const activateUserEvent = buildEvent(undefined, { email: 'any email' })
    await testRequired(getUserFunc, activateUserEvent, 'pathParameters', errorsNumber.requiredField)
    await testRequired(getUserFunc, activateUserEvent, 'pathParameters.email', errorsNumber.requiredField)
  })
})

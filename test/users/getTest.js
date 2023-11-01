const { buildEvent, buildUser, testSuccess, testRequired, testError, createActivatedUser } = require('../utils/testUtils')

const getUserFunc = require('../../src/lambda/users').getUser

describe('Get users tests', () => {
  it('Should validate the input', async() => {
    const getUserEvent = buildEvent(undefined, { email: 'any email' })
    await testRequired(getUserFunc, getUserEvent, 'pathParameters', errorsNumber.requiredField)
    await testRequired(getUserFunc, getUserEvent, 'pathParameters.email', errorsNumber.requiredField)
  })
  it('Should return a error if user dont exist', async() => {
    const getUserEvent = buildEvent(undefined, { email: 'any email' })
    await testError(getUserFunc, getUserEvent, 404, errorsNumber.inexistentEmail)
  })
  it('Should return a user', async() => {
    const user = await createActivatedUser()
    const getUserEvent = buildEvent(undefined, { email: user.email })
    const response = await testSuccess(getUserFunc, getUserEvent)
    response.should.have.property('status').which.is.equal('Active')
    response.should.have.property('email').which.is.equal(user.email)
    response.should.not.have.property('password')
  })
})

const errorsNumber = {
  requiredField: 0,
  inexistentEmail: 5,
}

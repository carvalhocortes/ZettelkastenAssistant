const { buildEvent, testSuccess, testRequired, testError, createActivatedUser, authenticateUser } = require('../helper/testHelper')

const getUserFunc = require('../../src/lambda/users').getUser

let user

describe('Get users tests', () => {
  before(async () => {
    user = await createActivatedUser(undefined, undefined, 'administrator')
    await authenticateUser(user)
  })
  it('Should validate the input', async() => {
    const getUserEvent = buildEvent(undefined, { email: 'any email' })
    await testRequired(getUserFunc, getUserEvent, 'pathParameters', errorsNumber.requiredField)
    await testRequired(getUserFunc, getUserEvent, 'pathParameters.email', errorsNumber.requiredField)
  })
  it('Should return a error if the token dont exist', async() => {
    const getUserEvent = buildEvent(undefined, { }, undefined, 'inexiste token' )
    await testError(getUserFunc, getUserEvent, 401, errorsNumber.invalidToken)
  })
  it('Should return a error if sent user dont exist', async() => {
    const getUserEvent = buildEvent(undefined, { email: 'any email' })
    await testError(getUserFunc, getUserEvent, 404, errorsNumber.inexistentEmail)
  })
  it('Should return a sent user data', async() => {
    const getUserEvent = buildEvent(undefined, { email: user.email })
    const response = await testSuccess(getUserFunc, getUserEvent)
    response.should.have.property('status').which.is.equal('Active')
    response.should.have.property('email').which.is.equal(user.email)
    response.should.not.have.property('password')
  })

  it('Should return a logged user data', async() => {
    const user = await createActivatedUser()
    await authenticateUser(user)
    const getUserEvent = buildEvent(undefined, { email: user.email })
    const response = await testSuccess(getUserFunc, getUserEvent)
    response.should.have.property('status').which.is.equal('Active')
    response.should.have.property('email').which.is.equal(user.email)
    response.should.not.have.property('password')
  })
})

const errorsNumber = {
  requiredField: 1001,
  invalidToken: 1002,
  inexistentEmail: 2003
}

const { buildEvent, testSuccess, testRequired, testError, createActivatedUser, authenticateUser } = require('../utils/testUtils')

const deleteUserFunc = require('../../src/lambda/users').deleteUser

let user

describe('Delete users tests', () => {
  before(async () => {
    user = await createActivatedUser(undefined, undefined, 'administrator')
    await authenticateUser(user)
  })
  it('Should validate the input', async() => {
    const deleteUserEvent = buildEvent(undefined, { email: 'any email' })
    await testRequired(deleteUserFunc, deleteUserEvent, 'pathParameters', errorsNumber.requiredField)
    await testRequired(deleteUserFunc, deleteUserEvent, 'pathParameters.email', errorsNumber.requiredField)
  })
  it('Should return a error if the token dont exist', async() => {
    const deleteUserEvent = buildEvent(undefined, undefined, undefined, 'inexiste token' )
    await testError(deleteUserFunc, deleteUserEvent, 401, errorsNumber.invalidToken)
  })
  it('Should return a error if user dont exist', async() => {
    const deleteUserEvent = buildEvent(undefined, { email: 'any email' })
    await testError(deleteUserFunc, deleteUserEvent, 404, errorsNumber.inexistentEmail)
  })
  it('Should delete a sent user', async() => {
    const deleteUserEvent = buildEvent(undefined, { email: user.email })
    const response = await testSuccess(deleteUserFunc, deleteUserEvent)
    response.should.have.property('status').which.is.equal('Deleted')
    response.should.have.property('email').which.is.equal(user.email)
    response.should.not.have.property('password')
  })
  it('Should delete a logged user', async() => {
    const user = await createActivatedUser()
    await authenticateUser(user)
    const deleteUserEvent = buildEvent(undefined, { email: user.email })
    const response = await testSuccess(deleteUserFunc, deleteUserEvent)
    response.should.have.property('status').which.is.equal('Deleted')
    response.should.have.property('email').which.is.equal(user.email)
    response.should.not.have.property('password')
  })
})

const errorsNumber = {
  requiredField: 0,
  invalidToken: 4,
  inexistentEmail: 5,
}

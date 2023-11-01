const { buildEvent, testSuccess, testRequired, testError, createActivatedUser } = require('../utils/testUtils')

const deleteUserFunc = require('../../src/lambda/users').deleteUser

describe('Delete users tests', () => {
  it('Should validate the input', async() => {
    const deleteUserEvent = buildEvent(undefined, { email: 'any email' })
    await testRequired(deleteUserFunc, deleteUserEvent, 'pathParameters', errorsNumber.requiredField)
    await testRequired(deleteUserFunc, deleteUserEvent, 'pathParameters.email', errorsNumber.requiredField)
  })
  it('Should return a error if user dont exist', async() => {
    const deleteUserEvent = buildEvent(undefined, { email: 'any email' })
    await testError(deleteUserFunc, deleteUserEvent, 404, errorsNumber.inexistentEmail)
  })
  it('Should return a deleted user', async() => {
    const user = await createActivatedUser()
    const deleteUserEvent = buildEvent(undefined, { email: user.email })
    const response = await testSuccess(deleteUserFunc, deleteUserEvent)
    response.should.have.property('status').which.is.equal('Deleted')
    response.should.have.property('email').which.is.equal(user.email)
    response.should.not.have.property('password')
  })
})

const errorsNumber = {
  requiredField: 0,
  inexistentEmail: 5,
}

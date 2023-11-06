const { buildEvent, testSuccess, testRequired, testError, createActivatedUser, authenticateUser, buildUser } = require('../helper/testHelper')
const userDb = require('../../src/db/userDb')

const updateUserFunc = require('../../src/lambda/users').updateUser

let user

describe('Update users tests', () => {
  before(async () => {
    user = await createActivatedUser(undefined, undefined, 'administrator')
    await authenticateUser(user)
  })
  it('Should validate the input', async () => {
    const updateUserEvent = buildEvent({ }, { email: 'any email' })
    await testRequired(updateUserFunc, updateUserEvent, 'pathParameters', errorsNumber.requiredField)
    await testRequired(updateUserFunc, updateUserEvent, 'pathParameters.email', errorsNumber.requiredField)
    await testRequired(updateUserFunc, updateUserEvent, 'body', errorsNumber.requiredField)
    await testError(updateUserFunc, updateUserEvent, 400, errorsNumber.requiredField)
  })
  it('Should return a error if the token dont exist', async() => {
    const updateUserEvent = buildEvent(undefined, undefined, undefined, 'inexiste token' )
    await testError(updateUserFunc, updateUserEvent, 401, errorsNumber.invalidToken)
  })
  it('Should not update email, status', async () => {
    let updateUserEvent = buildEvent({ email: 'anyEmail' }, { email: 'any email' })
    await testError(updateUserFunc, updateUserEvent, 400, errorsNumber.invalidUpdateField)
    updateUserEvent = buildEvent({ status: 'anyStatus' }, { email: 'any email' })
    await testError(updateUserFunc, updateUserEvent, 400, errorsNumber.invalidUpdateField)
    updateUserEvent = buildEvent({ permission: 'anyPermission' }, { email: 'any email' })
    await testError(updateUserFunc, updateUserEvent, 400, errorsNumber.invalidUpdateField)
  })
  it('Should not create user with invalid birth date', async () => {
    let birthday = 'invalid date'
    let updateUserEvent = buildEvent({ birthday }, { email: user.email })
    await testError(updateUserFunc, updateUserEvent, 400, errorsNumber.invalidBirthdaySchema)
    birthday = '31/12/2015'
    updateUserEvent = buildEvent({ birthday }, { email: user.email })
    await testError(updateUserFunc, updateUserEvent, 400, errorsNumber.invalidBirthdaySchema)
    birthday = '31/12/15'
    updateUserEvent = buildEvent({ birthday }, { email: user.email })
    await testError(updateUserFunc, updateUserEvent, 400, errorsNumber.invalidBirthdaySchema)
  })
  it('Should return a error if sent user dont exist', async() => {
    const updateUserEvent = buildEvent({ test: 'test'}, { email: 'any email' })
    await testError(updateUserFunc, updateUserEvent, 404, errorsNumber.inexistentEmail)
  })
  it('Should not accept repeated or weak passwords', async () => {
    let updateUserEvent = buildEvent({ password: user.password}, { email: user.email })
    await testError(updateUserFunc, updateUserEvent, 400, errorsNumber.passwordAlreadyUsed)
    updateUserEvent = buildEvent({ password: 'weakPass'}, { email: user.email })
    await testError(updateUserFunc, updateUserEvent, 400, errorsNumber.invalidPasswordSchema)
  })
  it('Should update sent user', async () => {
    const updateUserEvent = buildEvent({ avatar: 'newAvatar', city: 'newCity', nonDefault: 'nonUsed'}, { email: user.email })
    const response = await testSuccess(updateUserFunc, updateUserEvent)
    response.should.have.property('email').which.is.equal(user.email)
    response.should.have.property('avatar').which.is.equal('newAvatar')
    response.should.have.property('city').which.is.equal('newCity')
    const updatedUser = await userDb.getByEmail(user.email)
    updatedUser.should.have.property('updateHistory')
    updatedUser.updateHistory[0].should.have.property('at')
    updatedUser.updateHistory[0].should.have.property('OldData')
    updatedUser.updateHistory[0].OldData.should.have.property('city').which.is.equal(user.city)
    updatedUser.updateHistory[0].OldData.should.have.property('avatar').which.is.equal(user.avatar)
  })
  it('Should update logged user', async () => {
    const user = await createActivatedUser()
    await authenticateUser(user)
    const updateUserEvent = buildEvent({ avatar: 'newAvatar', city: 'newCity', nonDefault: 'nonUsed'}, { email: user.email })
    const response = await testSuccess(updateUserFunc, updateUserEvent)
    response.should.have.property('email').which.is.equal(user.email)
    response.should.have.property('avatar').which.is.equal('newAvatar')
    response.should.have.property('city').which.is.equal('newCity')
    const updatedUser = await userDb.getByEmail(user.email)
    updatedUser.should.have.property('updateHistory')
    updatedUser.updateHistory[0].should.have.property('at')
    updatedUser.updateHistory[0].should.have.property('OldData')
    updatedUser.updateHistory[0].OldData.should.have.property('city').which.is.equal(user.city)
    updatedUser.updateHistory[0].OldData.should.have.property('avatar').which.is.equal(user.avatar)
  })
})

const errorsNumber = {
  requiredField: 1001,
  invalidToken: 1002,
  inexistentEmail: 2003,
  invalidUpdateField: 1004,
  passwordAlreadyUsed: 2008,
  invalidPasswordSchema: 2009,
  invalidBirthdaySchema: 2011
}

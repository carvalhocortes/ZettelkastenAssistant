
const uuid = require('uuid').v4

const { buildEvent, testSuccess, testError, testRequired } = require('../utils/testUtils')
const userDb = require('../../src/db/userDb')

const createUserFunc = require('../../src/lambda/users').createUser

const uniqueEmail = () => `${uuid()}@example.com`

const buildUser = (email = uniqueEmail()) => ({
  email,
  password: 'GoodPass@123',
  birthDate: '01/12/1984',
  city: 'San Francisco',
  country: 'US',
  avatar: 'super man'
})

describe('Create users tests', () => {
  it('Should validate the input', async () => {
    const user = buildUser()
    const createUserEvent = buildEvent(user)
    await testRequired(createUserFunc, createUserEvent, 'body', errorsNumber.requiredField)
    await testRequired(createUserFunc, createUserEvent, 'body.email', errorsNumber.requiredField)
    await testRequired(createUserFunc, createUserEvent, 'body.password', errorsNumber.requiredField)
    await testRequired(createUserFunc, createUserEvent, 'body.city', errorsNumber.requiredField)
    await testRequired(createUserFunc, createUserEvent, 'body.country', errorsNumber.requiredField)
  })
  it('Should create a user', async () => {
    const user = buildUser()
    user.cantSaveThisField = 'dontSaveThisField'
    const createUserEvent = buildEvent(user)
    const response = await testSuccess(createUserFunc, createUserEvent, 201)
    response.should.have.property('token').be.a.String()
    response.token.should.be.ok()
    const createdUser = await userDb.getByEmail(user.email)
    createdUser.should.have.property('status').which.is.equal('Pending')
    createdUser.should.have.property('email').which.is.equal(user.email)
    createdUser.should.have.property('password')
    createdUser.should.have.property('birthDate').which.is.equal(user.birthDate)
    createdUser.should.have.property('city').which.is.equal(user.city)
    createdUser.should.have.property('country').which.is.equal(user.country)
    createdUser.should.have.property('avatar').which.is.equal(user.avatar)
    createdUser.should.not.have.property('cantSaveThisField')
  })
  it('Should not create a existent user', async () => {
    const user = buildUser()
    const createUserEvent = buildEvent(user)
    await testSuccess(createUserFunc, createUserEvent, 201)
    await testError(createUserFunc, createUserEvent, 400, errorsNumber.userAlreadyExists)
  })

  it('Should create a user using a deleted account', async () => {
    const user = buildUser()
    let createUserEvent = buildEvent(user)
    await testSuccess(createUserFunc, createUserEvent, 201)
    await userDb.update({ status: 'Deleted' }, user.email)
    delete user.avatar
    createUserEvent = buildEvent(user)
    const response = await testSuccess(createUserFunc, createUserEvent, 201)
    response.should.have.property('token').be.a.String()
    response.token.should.be.ok()
    const createdUser = await userDb.getByEmail(user.email)
    createdUser.should.not.have.property('avatar')
  })
})

const errorsNumber = {
  requiredField: 0,
  userAlreadyExists: 8
}


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
    const createUserEvent = buildEvent(buildUser())
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
    createdUser.should.have.property('permission').which.is.equal('user')
    createdUser.should.not.have.property('cantSaveThisField')
  })
  it('Should not create user with invalid birth date', async () => {
    const user = buildUser()
    user.birthDate = 'invalid date'
    let createUserEvent = buildEvent(user)
    await testError(createUserFunc, createUserEvent, 400, errorsNumber.invalidBirthDateSchema)
    user.birthDate = '31/12/2015'
    createUserEvent = buildEvent(user)
    await testError(createUserFunc, createUserEvent, 400, errorsNumber.invalidBirthDateSchema)
    user.birthDate = '31/12/15'
    createUserEvent = buildEvent(user)
    await testError(createUserFunc, createUserEvent, 400, errorsNumber.invalidBirthDateSchema)
  })
  it('Should not create user with invalid email', async () => {
    const createUserEvent = buildEvent(buildUser(`${uuid()}.@invalidExample.com`))
    await testError(createUserFunc, createUserEvent, 400, errorsNumber.invalidEmailSchema)
  })
  it('Should not create user with invalid password', async () => {
    const user = buildUser()
    user.password = 'invalidPassword'
    const createUserEvent = buildEvent(user)
    await testError(createUserFunc, createUserEvent, 400, errorsNumber.invalidPasswordSchema)
  })
  it('Should not create a existent user', async () => {
    const createUserEvent = buildEvent(buildUser())
    await testSuccess(createUserFunc, createUserEvent, 201)
    await testError(createUserFunc, createUserEvent, 400, errorsNumber.emailNotAvailable)
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
  invalidPasswordSchema: 12,
  emailNotAvailable: 13,
  invalidEmailSchema: 14,
  invalidBirthDateSchema: 15
}

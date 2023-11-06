const { verify } = require('jsonwebtoken')

const { buildEvent, testSuccess, testRequired, testError, createActivatedUser } = require('../helper/testHelper')
const userDb = require('../../src/db/userDb')

const getUnlockTokenFunc = require('../../src/lambda/users').getUnlockToken

const jwtSecret = process.env.JWT_SECRET

describe('Get unlock token tests', () => {
  it('Should validate the input', async () => {
    const getUnlockTokenEvent = buildEvent(undefined, { email: 'any email' })
    await testRequired(getUnlockTokenFunc, getUnlockTokenEvent, 'pathParameters', errorsNumber.requiredField)
    await testRequired(getUnlockTokenFunc, getUnlockTokenEvent, 'pathParameters.email', errorsNumber.requiredField)
  })
  it('Should not generate token to a non locked user', async () => {
    const user = await createActivatedUser()
    const getUnlockTokenEvent = buildEvent(undefined, { email: user.email })
    await testError(getUnlockTokenFunc, getUnlockTokenEvent, 400, errorsNumber.userDontNeedToken)
  })
  it('Should generate a activation token', async () => {
    const user = await createActivatedUser()
    await userDb.update({ status: 'Pending'}, user.email)
    const getUnlockTokenEvent = buildEvent(undefined, { email: user.email })
    const response = await testSuccess(getUnlockTokenFunc, getUnlockTokenEvent)
    response.should.have.property('token').be.a.String()
    response.token.should.be.ok()
    const audience = 'activeUser'
    const verifiedToken = verify(response.token, jwtSecret, { audience })
    verifiedToken.should.have.property('aud').which.is.equal(audience)
    verifiedToken.should.have.property('email').which.is.equal(user.email)
  })
  it('Should generate a unlock token', async () => {
    const user = await createActivatedUser()
    const getUnlockTokenEvent = buildEvent(undefined, { email: user.email })
    await userDb.update({ status: 'Locked'}, user.email)
    const response = await testSuccess(getUnlockTokenFunc, getUnlockTokenEvent)
    response.should.have.property('token').be.a.String()
    response.token.should.be.ok()
    const audience = 'unlockUser'
    const verifiedToken = verify(response.token, jwtSecret, { audience })
    verifiedToken.should.have.property('aud').which.is.equal(audience)
    verifiedToken.should.have.property('email').which.is.equal(user.email)
  })
})

const errorsNumber = {
  requiredField: 1001,
  lockedUser: 2006,
  userDontNeedToken: 2007
}

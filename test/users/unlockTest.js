
const { buildEvent, testSuccess, testRequired, testError, createActivatedUser } = require('../utils/testUtils')
const userDb = require('../../src/db/userDb')

const getUnlockTokenFunc = require('../../src/lambda/users').getUnlockToken
const unlockTokenFunc = require('../../src/lambda/users').unlockUser

describe('Unlock users tests', () => {
  it('Should validate the input', async () => {
    const unlockUserEvent = buildEvent({ token: 'Any Token', password: 'AnyPassword' })
    await testRequired(unlockTokenFunc, unlockUserEvent, 'body', errorsNumber.requiredField)
    await testRequired(unlockTokenFunc, unlockUserEvent, 'body.token', errorsNumber.requiredField)
    await testRequired(unlockTokenFunc, unlockUserEvent, 'body.password', errorsNumber.requiredField)
  })
  it('Should not accept bad tokens', async () => {
    const unlockUserEvent = buildEvent({ token: 'Any Token', password: 'AnyPassword' })
    await testError(unlockTokenFunc, unlockUserEvent, 401, errorsNumber.invalidToken)
  })
  it('Should not accept weak passwords', async () => {
    const user = await createActivatedUser()
    await userDb.update({ status: 'Locked' }, user.email)
    const getUnlockTokenEvent = buildEvent(undefined, { email: user.email })
    const { token } = await testSuccess(getUnlockTokenFunc, getUnlockTokenEvent)
    const unlockUserEvent = buildEvent({ token, password: 'AnyPassword' })
    await testError(unlockTokenFunc, unlockUserEvent, 400, errorsNumber.invalidPasswordSchema)
  })
  it('Should not accept repeated passwords', async () => {
    const user = await createActivatedUser()
    await userDb.update({ status: 'Locked'}, user.email)
    const getUnlockTokenEvent = buildEvent(undefined, { email: user.email })
    const { token } = await testSuccess(getUnlockTokenFunc, getUnlockTokenEvent)
    const unlockUserEvent = buildEvent({ token, password: user.password })
    await testError(unlockTokenFunc, unlockUserEvent, 400, errorsNumber.passwordAlreadyUsed)
  })

  it('Should unlock user', async () => {
    const user = await createActivatedUser()
    await userDb.update({ status: 'Locked', loginRecord: { wrongAttempts: 5 } }, user.email)
    const getUnlockTokenEvent = buildEvent(undefined, { email: user.email })
    const { token } = await testSuccess(getUnlockTokenFunc, getUnlockTokenEvent)
    const unlockUserEvent = buildEvent({ token, password: 'aBrandNewPassWord@123' })
    const response = await testSuccess(unlockTokenFunc, unlockUserEvent)
    response.should.have.property('email').which.is.equal(user.email)
    response.should.have.property('status').which.is.equal('Active')
    response.loginRecord.wrongAttempts.should.is.equal(0)
    response.should.not.have.property('password')
  })
})

const errorsNumber = {
  requiredField: 0,
  invalidToken: 4,
  passwordAlreadyUsed: 11,
  invalidPasswordSchema: 12
}

const errorCode = c => 2000 + c

module.exports = {
  invalidPassword:(remainingAttempts) => ({
    httpCode: 401,
    code: errorCode(1),
    msg: `Invalid Password. You have ${ remainingAttempts } attempts left.`
  }),
  nonAuthorized: {
    httpCode: 401,
    code: errorCode(2),
    msg: 'Non authorized.'
  },
  inexistentEmail: (email) => ({
    httpCode: 404,
    code: errorCode(3),
    msg: `${ email } not registered.`
  }),
  nonActivatableUser: {
    httpCode: 400,
    code: errorCode(4),
    msg: 'User is already active.'
  },
  inactivatedUser: {
    httpCode: 401,
    code: errorCode(5),
    msg: 'Is necessary to activate this user.'
  },
  lockedUser: {
    httpCode: 401,
    code: errorCode(6),
    msg: 'This user was locked, change the password to unlock it.'
  },
  userDontNeedToken: (email) => ({
    httpCode: 400,
    code: errorCode(7),
    msg: `${ email } was not locked.`
  }),
  passwordAlreadyUsed: {
    httpCode: 400,
    code: errorCode(8),
    msg: 'This password is already used.'
  },
  invalidPasswordSchema: {
    httpCode: 400,
    code: errorCode(9),
    msg: `Invalid password.`
  },
  invalidEmailSchema: {
    httpCode: 400,
    code: errorCode(10),
    msg: 'The email address must be valid.'
  },
  invalidBirthdaySchema: {
    httpCode: 400,
    code: errorCode(11),
    msg: 'The data should be valid.'
  },
  emailNotAvailable: {
    httpCode: 400,
    code: errorCode(12 ),
    msg: `This email is not available.`
  }
}

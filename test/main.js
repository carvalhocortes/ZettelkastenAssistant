const should = require('should')

process.env.SHOW_LOGS = false
process.env.SALT = "AnyGodSaltAndABitOfMSG"
process.env.JWT_SECRET = "AReallyGoodSecretToJWT"
process.env.REGION = "us-east-2"
process.env.FILES_BUCKET = `zettelkasten-files-${process.env.STAGE}`
process.env.USERS_TABLE = `zettelkasten-users-${process.env.STAGE}`

process.env.DB_ENDPOINT = 'http://localhost:8000'

describe('Zettelkasten Assistant tests', () => {
  require('./users/createTest')
  require('./users/activateTest')
  require('./users/authenticateTest')
  require('./users/getTest')
  require('./users/updateTest')
  require('./users/getUnlockTokenTest')
  require('./users/unlockTest')
  require('./users/deleteTest')
})

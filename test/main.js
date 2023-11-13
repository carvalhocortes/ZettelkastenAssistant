const should = require('should')
const awsMock = require( 'aws-sdk-mock' )
awsMock.mock('S3', 'getObject', { Body: 'I dont know what this content would be like', Metadata: { type: 'book' } })

process.env.SHOW_LOGS = false
process.env.REGION = 'us-east-2'
process.env.SALT = 'AnyGodSaltAndABitOfMSG'
process.env.JWT_SECRET = 'AReallyGoodSecretToJWT'
process.env.DOCALYSIS_TOKEN = 'us-east-2'
process.env.MENDELEY_ID = '123PIN'
process.env.MENDELEY_SECRET = '456PIN'
process.env.MENDELEY_REDIRECT = 'redirectURL'
process.env.MENDELEY_STATE = ''
process.env.MENDELEY_OAUTH_URL = 'https://api.mendeley.com/oauth/authorize'
process.env.FILES_TABLE = `zettelkasten-files-${process.env.STAGE}`
process.env.USERS_TABLE = `zettelkasten-users-${process.env.STAGE}`
process.env.FILES_BUCKET = `zettelkasten-files-${process.env.STAGE}`


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
  require('./files/createPreSignedUrlTest')
  require('./files/handleFileUploadedTest')
  require('./scheduledProcess/scheduledFileProcessTest')
  require('./mendeley/oAuthTests')
})

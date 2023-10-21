import 'should'

process.env.AWS_REGION = 'us-east-2'

if (process.env.TEST_REMOTE) {
  console.log(`Testing remote on stage ${process.env.STAGE}`)
  process.env.DB_ENDPOINT = `https://dynamodb.${process.env.AWS_REGION}.amazonaws.com`
} else {
  console.log(`Testing local on stage ${process.env.STAGE}`)
  process.env.DB_ENDPOINT = 'http://localhost:8000'
}

process.env.SHOW_LOGS = 'false'

import scenario from './tests/testScenarioStartup'

const scenarioTimeout = 360000 // increase for test in aws

const skipTestsIfNeeded = (): void => {
  if (process.env.SKIP_TEST) {
    console.log('Skipping test')
    process.exit(0)
  }
}

describe('Zettelkasten tests', () => {
  describe('Create basic scenario', () => {
    it('Should create the scenario', function () {
      return scenario()
    }).timeout(scenarioTimeout)
    after(skipTestsIfNeeded)
  })
  require('./tests/handleMDfiles')
  require('./tests/sendDocalysisFile')
  require('./tests/handleDocalysis')
  require('./tests/createMendeley')
})

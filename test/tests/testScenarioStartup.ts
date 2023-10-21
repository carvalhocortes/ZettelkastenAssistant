import testUtils from 'test-utils'
import * as schemas from '../../src/db/schemas'

let showLogs = false
const validEnvs = ['dev']

const containsOneOf = (name: string, values: string[]): boolean => values.some(value => name.includes(value))

const createOrClearAllTables = (tableList: string[]): Promise<unknown> => {
  const schemasList = Object.values(schemas)
  return Promise.all(
    schemasList.map(schema => {
      const { TableName } = schema
      return testUtils.createOrClearTable(TableName, schema, tableList, showLogs)
    })
  )
}

if (!containsOneOf(process.env.STAGE!, validEnvs)) {
  console.log('Script não está rodando em ambiente de teste! Abortando')
  process.exit()
}

const createScenario = async (shouldLog = false): Promise<void> => {
  showLogs = shouldLog
  const tableList = await testUtils.listAllTables()
  await createOrClearAllTables(tableList)

}

export default createScenario

// import * as aws from 'aws-sdk'
// import dynamoUtils from 'dynamo-utils'
// import { Quotation } from '../types/quotationTypes'

// const dynamo = dynamoUtils(aws)
// const tableName = String(process.env.QUOTATION_TABLE)

// export const get = (accountName: string, id: string): Promise<Quotation | undefined> => dynamo.find(tableName, { accountName, id })

// export const save = (quotation: Quotation): Promise<Quotation> => dynamo.save(tableName, quotation, ['accountName', 'id'])

// export const update = ({ accountName, id }: Quotation, updateObj: Partial<Quotation>, keysToDelete?: string[]): Promise<Quotation> =>
//   dynamo.update(tableName, { accountName, id }, updateObj, keysToDelete, undefined, { updatedAt: true, returnUpdated: true })

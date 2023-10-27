const AWS = require('aws-sdk');

const tableName = process.env.USERS_TABLE
const region = process.env.REGION

AWS.config.update({ region })

const dynamoDB = new AWS.DynamoDB()


const credentialsIndex = {
  IndexName: 'credentialsIndex',
  KeySchema: [
    { AttributeName: 'email', KeyType: 'HASH' },
    { AttributeName: 'password', KeyType: 'RANGE' }
  ],
  Projection: { ProjectionType: 'ALL' }
}

dynamoDB.describeTable({ TableName: tableName }, (err, data) => {
    if (err && err.code === 'ResourceNotFoundException') {
        const params = {
          TableName: LOAN_DELAYED_PAYMENTS_TABLE,
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'email',
              KeyType: 'RANGE'
            }
          ],
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S'
            },
            {
              AttributeName: 'email',
              AttributeType: 'S'
            },
            {
              AttributeName: 'password',
              AttributeType: 'S'
            }
          ],
          GlobalSecondaryIndexes: [credentialsIndex],
          BillingMode: 'PAY_PER_REQUEST'
        }

        dynamoDB.createTable(params, (err, data) => {
            if (err) {
                console.error('Erro ao criar tabela:', JSON.stringify(err, null, 2));
            } else {
                console.log('Tabela criada:', JSON.stringify(data, null, 2));
            }
        });
    } else if (err) {
        console.error('Erro ao descrever a tabela:', JSON.stringify(err, null, 2));
    } else {
        console.log('Tabela já existe:', JSON.stringify(data, null, 2));
    }
});

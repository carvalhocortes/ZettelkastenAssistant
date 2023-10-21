const tsNode = require('ts-node')

tsNode.register({
  files: true,
  project: './test/tsconfig.json'
})

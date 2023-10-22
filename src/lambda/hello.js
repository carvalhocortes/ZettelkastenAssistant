const { success, error } = require('../util/lambdaUtil')

module.exports.handler = async (event) => {
  try {
    const body = {
      message: 'Olá mundo!',
      evento: event,
    }
    console.log('teste')
    return success(body)
  } catch (err) {
    return error(err)
  }
}

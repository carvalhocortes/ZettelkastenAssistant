const { success, error, processEvent } = require('../helper/lambdaHelper')
const mendeleyService = require('../service/mendeleyService')

const getAuthUrl = async (event) => {
  return processEvent(event, 'zettelkasten')
    .then((event) => mendeleyService.getAuthUrl(event))
    .then(response => success(response))
    .catch(err => error(err))
}

const mendeleyCallback = async (event) => {
  return processEvent(event)
    .then((event) => mendeleyService.mendeleyCallback(event))
    .then(response => success(response))
    .catch(err => error(err))
}

module.exports = {
  getAuthUrl,
  mendeleyCallback
}

const { success, error, processEvent } = require('../helper/lambdaHelper')
const services = [
  require('../service/fileService')
]

const scheduledProcess = async (event) => {
  return processEvent(event)
  .then(() => Promise.all(services.map((service) => service.scheduledProcess(event.body?.date))))
  .then(response => success(response))
  .catch(err => error(err))
}

module.exports = {
  scheduledProcess
}

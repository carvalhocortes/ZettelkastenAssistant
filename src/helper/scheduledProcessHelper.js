const { log } = require("./loggerHelper")

const generateScheduledProcess = async (scheduledProcess, db, { handler, doProcess = defaultProcessFn } = {}) =>
  (date) => {
    return db.findAllWithScheduledProcess(scheduledProcess, date)
      .then(records => {
        log({ process: scheduledProcess, size: records.length })
        return records
      })
      .then(doProcess(handler))
      .catch((err) => {
        console.log(err)
        throw err
      })
  }


// PRIVATE FUNCTIONS

const defaultProcessFn = (handler) =>
  async records => {
    const result = await Promise.allSettled(
      records.map(record => {
        log(record)
        return processRecord(handler, record)
      })
    )
    result.map(({ status, reason: error }, i) => {
      const record = records[i]
      if (status === 'rejected') log({ record, status, error })
      else log({ record, status })
    })
    return result
  }

const processRecord = (handler, record) => handler(record)

module.exports = {
  generateScheduledProcess
}

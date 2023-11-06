const { parse } = require('date-fns')
const constants = require('../common/constants')

const now = () => new Date().getTime()

const makeMoment = (dateString, dateFormat = constants.dateFormats.dateTimeFormat) => {
  const parsedDate = parse(dateString, dateFormat, new Date())
  return parsedDate.getTime()
}

const afterSeconds = (seconds) => {
  return now() + (seconds * 1000)
}

const afterMinutes = (minutes) => {
  return afterSeconds(minutes * 60)
}

module.exports = {
  now,
  makeMoment,
  afterSeconds,
  afterMinutes,
}

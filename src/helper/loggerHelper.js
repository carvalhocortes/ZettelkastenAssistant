const showLogs = process.env.SHOW_LOGS === 'true'

module.exports.log = (message) => {
  if (showLogs) console.log(message)
}

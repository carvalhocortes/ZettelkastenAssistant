const now = () => new Date().getTime()

const afterSeconds = (seconds) => {
  return now() + (seconds * 1000)
}

const afterMinutes = (minutes) => {
  return afterSeconds(minutes * 60)
}

module.exports = {
  now,
  afterSeconds,
  afterMinutes
}

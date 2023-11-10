'use strict'

const axios = require('axios')
const { log } = require('../helper/loggerHelper')
const fileErrors = require('../common/fileErrors')

const mendeleyId = process.env.MENDELEY_ID
const mendeleySecret = process.env.MENDELEY_SECRET
const mendeleyRedirect = process.env.MENDELEY_REDIRECT
const mendeleyState = process.env.MENDELEY_STATE



const sentFileToMendeley = async (fileName, url, user) => {

  return { data: 'data'}
}



// PRIVATE FUNCTIONS



module.exports = {
  sentFileToMendeley
}

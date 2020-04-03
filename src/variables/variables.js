const { getCustomConfig } = require('../utils/custom-config')
const { getProjectFilePath } = require('../utils/path')

if (!process.env.APP_ENV) {
  process.env.APP_ENV = 'production'
}

const { APP_ENV } = process.env
const APP_NAME = require(require.resolve(getProjectFilePath('package.json')))
  .name
let PUBLIC_PATH = '/'
let GIT_COMMIT_SHA = 'N/A'
let __DEV__ = process.env.NODE_ENV === 'development'

try {
  GIT_COMMIT_SHA = require('child_process')
    .execSync('git rev-parse HEAD')
    .toString()
    .replace('\n', '')
} catch (error) {
  // EMPTY
}

const customVariables = getCustomConfig().variables

const variables = {
  __DEV__,
  GIT_COMMIT_SHA,
  SENTRY_RELEASE: `${APP_ENV}-${GIT_COMMIT_SHA.substr(0, 7)}`,
  APP_ENV,
  APP_NAME,
  PUBLIC_PATH,
  ...customVariables,
}

const requiredVariableKeys = ['APP_TITLE']

if (!__DEV__) {
  for (const requiredKey of requiredVariableKeys) {
    if (!variables[requiredKey]) {
      throw new Error(`please config required variable: ${requiredKey}`)
    }
  }
}

module.exports = variables

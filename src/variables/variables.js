const { getCustomConfig } = require('../utils/custom-config')
const { getProjectFilePath } = require('../utils/path')
const pkg = require('../../package.json')

if (!process.env.APP_ENV) {
  process.env.APP_ENV = 'production'
}

const { APP_ENV } = process.env
// eslint-disable-next-line import/no-dynamic-require
const package = require(require.resolve(getProjectFilePath('package.json')))
const { name: APP_NAME, version: VERSION } = package
const PUBLIC_PATH = '/'
// eslint-disable-next-line no-underscore-dangle
const __DEV__ = process.env.NODE_ENV === 'development'
let GIT_COMMIT_SHA = 'N/A'

try {
  // eslint-disable-next-line global-require
  GIT_COMMIT_SHA = require('child_process')
    .execSync('git rev-parse HEAD')
    .toString()
    .replace('\n', '')
} catch (error) {
  // EMPTY
}

const customVariables = getCustomConfig().variables
const RELEASE = GIT_COMMIT_SHA.substr(0, 7)
const buildTime = new Date()
const variables = {
  __DEV__,
  GIT_COMMIT_SHA,
  RELEASE,
  VERSION,
  SENTRY_RELEASE: `${APP_ENV}-${RELEASE}`,
  APP_ENV,
  APP_NAME,
  PUBLIC_PATH,
  CLI_VERSION: pkg.version,
  BUILD_TIME: `${buildTime.toLocaleDateString()} ${buildTime.toLocaleTimeString()}`,
  ...customVariables
}

const requiredVariableKeys = ['APP_TITLE']

if (!__DEV__) {
  // eslint-disable-next-line no-restricted-syntax
  for (const requiredKey of requiredVariableKeys) {
    if (!variables[requiredKey]) {
      throw new Error(`please config required variable: ${requiredKey}`)
    }
  }
}

module.exports = variables

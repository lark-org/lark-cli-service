const { getCustomConfig } = require('../utils/custom-config')
const { getProjectFilePath } = require('../utils/path')

if (!process.env.APP_ENV) {
  process.env.APP_ENV = 'production'
}

const {
  FAAS_GIT_COMMIT_SHA,
  APP_ENV,
  FAAS_CDN_HOST_FALLBACK = '',
  FAAS_CDN_HOST = '',
  FAAS_CDN_RESOURCE_KEY_PREFIX,
} = process.env
const CDN_VENDOR_HOST = 'cc-ali.llscdn.com'
const CDN_VENDOR_HOST_FALLBACK = 'cc-b.llscdn.com'
const CDN_VENDOR_PUBLIC_URL = 'https://cc-ali.llscdn.com/vendor'
const APP_NAME = require(require.resolve(getProjectFilePath('package.json'))).name
let PUBLIC_PATH = '/'
let PUBLIC_PATH_FALLBACK = '/'
let GIT_COMMIT_SHA = 'N/A'
let __DEV__ = process.env.NODE_ENV === 'development'

if (FAAS_CDN_HOST) {
  PUBLIC_PATH = `https://${FAAS_CDN_HOST}/${FAAS_CDN_RESOURCE_KEY_PREFIX}`
  PUBLIC_PATH_FALLBACK = `https://${FAAS_CDN_HOST_FALLBACK}/${FAAS_CDN_RESOURCE_KEY_PREFIX}`
}

if (FAAS_GIT_COMMIT_SHA) {
  GIT_COMMIT_SHA = FAAS_GIT_COMMIT_SHA
} else {
  try {
    GIT_COMMIT_SHA = require('child_process')
      .execSync('git rev-parse HEAD')
      .toString()
      .replace('\n', '')
  } catch (error) {
    // EMPTY
  }
}

const customVariables = getCustomConfig().variables

const variables = {
  __DEV__,
  GIT_COMMIT_SHA,
  SENTRY_RELEASE: `${APP_ENV}-${GIT_COMMIT_SHA.substr(0, 7)}`,
  APP_ENV,
  APP_NAME,
  PUBLIC_PATH,
  PUBLIC_PATH_FALLBACK,
  CDN_VENDOR_HOST,
  CDN_VENDOR_HOST_FALLBACK,
  CDN_VENDOR_PUBLIC_URL,
  CDN_HOST_FALLBACK: FAAS_CDN_HOST_FALLBACK,
  CDN_HOST: FAAS_CDN_HOST,
  ...customVariables,
}

const requiredVariableKeys = [
  'CHANGELING_NAME',
  'SENTRY_DSN',
  'APP_TITLE',
]

if (!__DEV__) {
  for (const requiredKey of requiredVariableKeys) {
    if (!variables[requiredKey]) {
      throw new Error(`please config required variable: ${requiredKey}`)
    }
  }
}

module.exports = variables

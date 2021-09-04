const { getProjectFilePath, resolveApp } = require('../utils/path')
const { getCustomConfig } = require('../utils/custom-config')

const appPath = resolveApp('.')
const appTsConfig = resolveApp('tsconfig.json')
const appJsConfig = resolveApp('jsconfig.json')
const appNodeModules = resolveApp('node_modules')
const appWebpackCache = resolveApp('node_modules/.cache')
const appSrc = getProjectFilePath('./src')
const appBuild = getProjectFilePath('./dist')
const appPublic = getProjectFilePath('./public')

const appIndex = getProjectFilePath('./src/index.tsx')
const appPackageJson = getProjectFilePath('./package.json')
const yarnLockFile = getProjectFilePath('./yarn.lock')
const appPolyfill = require.resolve('../polyfills/index.js')
const appHtml = getProjectFilePath('./src/index.html')

const customPaths = getCustomConfig().paths

const paths = {
  appPath,
  appIndex,
  appSrc,
  appBuild,
  appPublic,
  appHtml,
  appPolyfill,
  yarnLockFile,
  appPackageJson,
  appTsConfig,
  appJsConfig,
  appWebpackCache,
  appNodeModules,
  ...customPaths
}

module.exports = {
  ...paths
}

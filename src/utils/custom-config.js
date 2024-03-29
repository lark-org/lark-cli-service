const fs = require('fs')
const { merge: mergeWebpackConfig } = require('webpack-merge')
const { getProjectFilePath } = require('./path')

let customConfig = null

const defaultConfig = {}

const getCustomConfig = () => {
  if (customConfig) {
    return customConfig
  }

  const larkConfig = getProjectFilePath('lark.config.js')
  try {
    // eslint-disable-next-line no-bitwise
    fs.accessSync(larkConfig, fs.constants.F_OK | fs.constants.R_OK)
    // eslint-disable-next-line
    customConfig = { ...defaultConfig, ...require(larkConfig) }
  } catch (e) {
    if (e.code === 'ENOENT') {
      // 文件不存在，使用默认配置
      customConfig = { ...defaultConfig }
    } else {
      // 文件存在，但require过程报错
      throw e
    }
  }
  return customConfig
}

let webpackConfig = null
const processWebpackConfig = (config) => {
  const customWebpackConfig = getCustomConfig().configureWebpack

  if (typeof customWebpackConfig === 'function') {
    webpackConfig = customWebpackConfig(config)
  } else if (typeof customWebpackConfig === 'object') {
    webpackConfig = customWebpackConfig
  }

  if (webpackConfig) {
    // eslint-disable-next-line no-param-reassign
    config = mergeWebpackConfig(config, webpackConfig)
  }
  return config
}

module.exports = {
  getCustomConfig,
  processWebpackConfig
}

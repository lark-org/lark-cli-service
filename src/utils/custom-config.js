const fs = require('fs')
const mergeWebpackConfig = require('webpack-merge')
const { getProjectFilePath } = require('./path')

let customConfig = null

const defaultConfig = {}

const getCustomConfig = () => {
  if (customConfig) {
    return customConfig
  }

  const llsConfig = getProjectFilePath('lark.config.js')
  try {
    // eslint-disable-next-line no-bitwise
    fs.accessSync(llsConfig, fs.constants.F_OK | fs.constants.R_OK)
    // eslint-disable-next-line
    customConfig = { ...defaultConfig, ...require(llsConfig) }
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

const processWebpackConfig = (config) => {
  const customWebpackConfig = getCustomConfig().configureWebpack

  if (typeof customWebpackConfig === 'function') {
    customConfig = customWebpackConfig(config)
  } else if (typeof customWebpackConfig === 'object') {
    customConfig = customWebpackConfig
  }

  if (customConfig) {
    // eslint-disable-next-line no-param-reassign
    config = mergeWebpackConfig(config, customConfig)
  }
  return config
}

module.exports = {
  getCustomConfig,
  processWebpackConfig
}

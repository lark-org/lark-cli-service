const { getProjectFilePath } = require('../utils/path')
const fs = require('fs')
const mergeWebpackConfig = require('webpack-merge')

let customConfig = null

const defaultConfig = {}

const getCustomConfig = () => {
  if (customConfig) {
    return customConfig
  }

  const llsConfig = getProjectFilePath('vira.config.js')
  try {
    fs.accessSync(llsConfig, fs.constants.F_OK | fs.constants.R_OK)
    customConfig = Object.assign({}, defaultConfig, require(llsConfig))
  } catch (e) {
    if (e.code === 'ENOENT') {
      // 文件不存在，使用默认配置
      customConfig = Object.assign({}, defaultConfig)
    } else {
      // 文件存在，但require过程报错
      throw e
    }
  }
  return customConfig
}

const processWebpackConfig = config => {
  const customWebpackConfig = getCustomConfig().configureWebpack
  let customConfig
  if (typeof customWebpackConfig === 'function') {
    customConfig = customWebpackConfig(config)
  } else if (typeof customWebpackConfig === 'object') {
    customConfig = customWebpackConfig
  }

  if (customConfig) {
    config = mergeWebpackConfig(config, customConfig)
  }
  return config
}

module.exports = {
  getCustomConfig,
  processWebpackConfig,
}

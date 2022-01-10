const { getProjectFilePath } = require('./utils/path')
const merge = require('deepmerge')
const fs = require('fs')
const path = require('path')
const { FAST_REFRESH: shouldUseReactRefresh } = require('./variables/variables')

// TODO: 作为一个 preset 的方式大概会更好

module.exports = (api) => {
  api.cache(() => process.env.NODE_ENV)
  const { NODE_ENV, BABEL_ENV } = process.env
  const resolverOpts = {
    root: [path.relative(__dirname, process.cwd())],
    extensions: ['.js', '.jsx', '.tsx', '.ts']
  }

  let environment = []

  if ((BABEL_ENV || NODE_ENV) === 'development') {
    environment = [
      shouldUseReactRefresh && require.resolve('react-refresh/babel'),
      ['@babel/plugin-syntax-dynamic-import']
    ].filter(Boolean)
  } else {
    environment = [
      '@babel/plugin-syntax-dynamic-import',
      'babel-plugin-transform-react-remove-prop-types',
      '@babel/plugin-transform-react-constant-elements'
    ]
  }

  const config = {
    presets: [
      '@babel/preset-env',
      '@babel/preset-typescript',
      '@babel/preset-react'
    ],
    plugins: [
      ...environment,
      ['babel-plugin-module-resolver', resolverOpts],
      '@babel/plugin-proposal-object-rest-spread',
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
      'babel-plugin-macros',
      '@babel/plugin-transform-runtime'
    ]
  }

  const projectBabelPath = getProjectFilePath('babel.config.js')

  let customBabelConfig = {}
  if (fs.existsSync(projectBabelPath)) {
    const configGetter = require(projectBabelPath)
    customBabelConfig = configGetter(config)
  }

  if (customBabelConfig.overrides) {
    delete customBabelConfig.overrides

    return customBabelConfig
  }

  const mergedConfig = merge(config, customBabelConfig)

  return mergedConfig
}

const webpack = require('webpack')
const { MFSU } = require('@umijs/mfsu')
const paths = require('../../variables/paths')
const builds = require('../../variables/builds')

const mfsu = new MFSU({
  cwd: paths.appPath,
  implementor: webpack,
  buildDepWithESBuild: builds.transpiler === 'esbuild'
})

module.exports = mfsu

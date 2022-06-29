const { getCustomConfig } = require('../utils/custom-config')

const customConfig = getCustomConfig()
const { build } = customConfig
const variables = {
  mfsu: false,
  transpiler: 'babel',
  transpilerOptions: {},
  ...build
}

module.exports = variables

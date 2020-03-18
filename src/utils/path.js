const path = require('path')

const getProjectFilePath = relativePath => path.resolve(process.cwd(), relativePath)

module.exports = {
  getProjectFilePath,
}

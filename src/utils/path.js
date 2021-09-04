const path = require('path')
const fs = require('fs-extra')

const appDirectory = fs.realpathSync(process.cwd())

const getProjectFilePath = (relativePath) =>
  path.resolve(process.cwd(), relativePath)
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)

module.exports = {
  getProjectFilePath,
  resolveApp
}

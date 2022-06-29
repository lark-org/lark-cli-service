const path = require('path')
const fs = require('fs-extra')

const appDirectory = fs.realpathSync(process.cwd())

const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx'
]

const resolveModule = (resolveFn, filePath) => {
  const extension = moduleFileExtensions.find((ext) =>
    fs.existsSync(resolveFn(`${filePath}.${ext}`))
  )

  if (extension) {
    return resolveFn(`${filePath}.${extension}`)
  }

  return resolveFn(`${filePath}.js`)
}
const getProjectFilePath = (relativePath) =>
  path.resolve(process.cwd(), relativePath)
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)

module.exports = {
  getProjectFilePath,
  resolveApp,
  resolveModule
}

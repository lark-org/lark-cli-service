/* eslint-disable @typescript-eslint/no-use-before-define */
process.env.NODE_ENV = 'development'
process.env.BABEL_ENV = 'development'

process.on('unhandledRejection', (err) => {
  throw err
})
const chalk = require('chalk')
const fs = require('fs-extra')

const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const clearConsole = require('react-dev-utils/clearConsole')
const {
  choosePort,
  createCompiler,
  prepareUrls
} = require('react-dev-utils/WebpackDevServerUtils')
const { checkBrowsers } = require('react-dev-utils/browsersHelper')
const configFactory = require('../webpack/webpack.config.dev')
const { APP_NAME: appName } = require('../variables/variables')
const { appPath, appTsConfig, yarnLockFile } = require('../variables/paths')

const isInteractive = process.stdout.isTTY

module.exports = async (defaultPort) => {
  try {
    await checkBrowsers(appPath, isInteractive)

    const DEFAULT_PORT = defaultPort || 3000
    const HOST = process.env.HOST || '0.0.0.0'

    if (process.env.HOST) {
      console.log(
        chalk.cyan(
          `Attempting to bind to HOST environment variable: ${chalk.yellow(
            chalk.bold(process.env.HOST)
          )}`
        )
      )
      console.log(
        `If this was unintentional, check that you haven't mistakenly set it in your shell.`
      )
      // console.log(
      //   `Learn more here: ${chalk.yellow('https://cra.link/advanced-config')}`
      // )
      console.log()
    }
    const port = await choosePort(HOST, DEFAULT_PORT)

    if (!port) {
      return
    }

    const urls = prepareUrls('http', HOST, port)
    const config = configFactory()
    const useTypeScript = fs.existsSync(appTsConfig)
    const useYarn = fs.existsSync(yarnLockFile)
    const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === 'true'
    const devSocket = {
      warnings: (warnings) => {
        console.warn(warnings)
        devServer.sockWrite(devServer.sockets, 'warnings', warnings)
      },
      errors: (errors) => {
        console.error(errors)
        devServer.sockWrite(devServer.sockets, 'errors', errors)
      }
    }
    const compiler = createCompiler({
      appName,
      config,
      devSocket,
      urls,
      useYarn,
      webpack,
      useTypeScript,
      tscCompileOnError
    })
    const serverConfig = {
      ...config.devServer,
      host: HOST,
      port
    }
    const devServer = new WebpackDevServer(serverConfig, compiler)

    // Launch WebpackDevServer.
    // eslint-disable-next-line consistent-return
    devServer.startCallback(() => {
      if (isInteractive) {
        clearConsole()
      }
      console.log(chalk.cyan('Starting the development server...\n'))
    })
    ;['SIGINT', 'SIGTERM'].forEach((sig) => {
      process.on(sig, () => {
        devServer.close()
        process.exit()
      })
    })
    if (process.env.CI !== 'true') {
      // Gracefully exit when stdin ends
      process.stdin.on('end', () => {
        devServer.close()
        process.exit()
      })
    }
  } catch (err) {
    if (err && err.message) {
      console.log(err.message)
    }
    process.exit(1)
  }
}

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
const {
  APP_NAME: appName,
  MFSU: MFSU_ENABLED
} = require('../variables/variables')
const { appPath, appTsConfig, yarnLockFile } = require('../variables/paths')
const mfsu = require('../webpack-plugins/mfsu')

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

    // eslint-disable-next-line no-inner-declarations
    async function getDevConfig() {
      const config = configFactory()

      if (MFSU_ENABLED) {
        await mfsu.setWebpackConfig({
          config
        })
      }
      return config
    }

    const urls = prepareUrls('http', HOST, port)
    const config = await getDevConfig()
    const useTypeScript = fs.existsSync(appTsConfig)
    const useYarn = fs.existsSync(yarnLockFile)
    const compiler = createCompiler({
      appName,
      config,
      urls,
      useYarn,
      webpack,
      useTypeScript
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
    console.log(err)
    if (err && err.message) {
      console.log(err.message)
    }
    process.exit(1)
  }
}

process.env.NODE_ENV = 'development'
process.env.BABEL_ENV = 'development'

const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const clearConsole = require('react-dev-utils/clearConsole')
const {
  choosePort,
  createCompiler,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils')
const configFactory = require('../webpack/webpack.config.dev')
const { APP_NAME: appName } = require('../variables/variables')

const isInteractive = process.stdout.isTTY

module.exports = async (defaultPort) => {
  try {
    const host = '0.0.0.0'
    const port = await choosePort(host, defaultPort)

    if (!port) {
      return
    }

    const urls = prepareUrls('http', host, port)
    const config = configFactory()
    const devSocket = {
      warnings: warnings =>
        devServer.sockWrite(devServer.sockets, 'warnings', warnings),
      errors: errors => devServer.sockWrite(devServer.sockets, 'errors', errors),
    }
    const compiler = createCompiler({
      appName,
      config,
      devSocket,
      urls,
      useYarn: true,
      webpack,
    })
    const devServer = new WebpackDevServer(compiler, config.devServer)

    // Launch WebpackDevServer.
    devServer.listen(port, host, err => {
      if (err) {
        console.log(err)

        return
      }
      if (isInteractive) {
        clearConsole()
      }
    })

    ;['SIGINT', 'SIGTERM'].forEach(sig => {
      process.on(sig, () => {
        devServer.close()
        process.exit()
      })
    })
  } catch (err) {
    if (err && err.message) {
      console.log(err.message)
    }
    process.exit(1)
  }
}

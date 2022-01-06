/* eslint-disable promise/always-return */
process.env.NODE_ENV = 'production'
process.env.BABEL_ENV = 'production'
process.env.CI = false

if (!process.env.APP_ENV) {
  process.env.APP_ENV = 'production'
}

process.on('unhandledRejection', (err) => {
  console.error(err)
  throw err
})

const webpack = require('webpack')
const fs = require('fs-extra')
const chalk = require('chalk')
const bfj = require('bfj')
const FileSizeReporter = require('react-dev-utils/FileSizeReporter')
const printBuildError = require('react-dev-utils/printBuildError')
const { checkBrowsers } = require('react-dev-utils/browsersHelper')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')

const configFactory = require('../webpack/webpack.config.build')
const { appPath, appBuild, appPublic, appHtml } = require('../variables/paths')

const { measureFileSizesBeforeBuild, printFileSizesAfterBuild } =
  FileSizeReporter

const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024

const isInteractive = process.stdout.isTTY

function build(previousFileSizes) {
  console.log(`${chalk.green('Environment:')} ${process.env.APP_ENV}`)
  console.log()
  console.log('Creating an optimized production build...')
  console.log()

  const config = configFactory()
  const compiler = webpack(config)

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages

      if (err) {
        if (!err.message) {
          return reject(err)
        }

        let errMessage = err.message

        // Add additional information for postcss errors
        if (Object.prototype.hasOwnProperty.call(err, 'postcssNode')) {
          errMessage += `\nCompileError: Begins at CSS selector ${err?.postcssNode?.selector}`
        }

        messages = formatWebpackMessages({
          errors: [errMessage],
          warnings: []
        })
      } else {
        console.error(
          stats.toJson({ all: false, warnings: true, errors: true })
        )
        messages = formatWebpackMessages(
          stats.toJson({ all: false, warnings: true, errors: true })
        )
      }
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1
        }

        return reject(new Error(messages.errors.join('\n\n')))
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' ||
          process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        // Ignore sourcemap warnings in CI builds. See #8227 for more info.
        const filteredWarnings = messages.warnings.filter(
          (w) => !/Failed to parse source map/.test(w)
        )
        if (filteredWarnings.length) {
          console.log(
            chalk.yellow(
              '\nTreating warnings as errors because process.env.CI = true.\n' +
                'Most CI servers set it automatically.\n'
            )
          )
          return reject(new Error(filteredWarnings.join('\n\n')))
        }
      }

      const resolveArgs = {
        stats,
        previousFileSizes,
        warnings: messages.warnings
      }
      const argv = process.argv.slice(2)
      const writeStatsJson = argv.indexOf('--stats') !== -1

      if (writeStatsJson) {
        // eslint-disable-next-line promise/no-promise-in-callback
        return bfj
          .write(`${appBuild}/bundle-stats.json`, stats.toJson())
          .then(() => resolve(resolveArgs))
          .catch((error) => reject(new Error(error)))
      }

      return resolve(resolveArgs)
    })
  })
}

function copyPublicFolder() {
  fs.copySync(appPublic, appBuild, {
    dereference: true,
    filter: (file) => file !== appHtml
  })
}

module.exports = () => {
  checkBrowsers(appPath, isInteractive)
    .then(() => measureFileSizesBeforeBuild(appBuild))
    .then((previousFileSizes) => {
      // Remove all content but keep the directory so that
      // if you're in it, you don't end up in Trash
      fs.emptyDirSync(appBuild)
      // Merge with the public folder
      copyPublicFolder()

      // Start the webpack build
      return build(previousFileSizes)
    })
    .then(
      ({ stats, previousFileSizes, warnings }) => {
        if (warnings.length) {
          console.log(chalk.yellow('Compiled with warnings.\n'))
          console.log(warnings.join('\n\n'))
          console.log(
            `\nSearch for the ${chalk.underline(
              chalk.yellow('keywords')
            )} to learn more about each warning.`
          )
          console.log(
            `To ignore, add ${chalk.cyan(
              '// eslint-disable-next-line'
            )} to the line before.\n`
          )
        } else {
          console.log(chalk.green('Compiled successfully.\n'))
        }
        console.log('File sizes after gzip:\n')
        printFileSizesAfterBuild(
          stats,
          previousFileSizes,
          appBuild,
          WARN_AFTER_BUNDLE_GZIP_SIZE,
          WARN_AFTER_CHUNK_GZIP_SIZE
        )
        console.log()
      },
      (err) => {
        const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === 'true'
        if (tscCompileOnError) {
          console.log(
            chalk.yellow(
              'Compiled with the following type errors (you may want to check these before deploying your app):\n'
            )
          )
          printBuildError(err)
        } else {
          console.log(chalk.red('Failed to compile.\n'))
          printBuildError(err)
          process.exit(1)
        }
      }
    )
    .catch((err) => {
      if (err && err.message) {
        console.error(err.message)
      }
      process.exit(1)
    })
}

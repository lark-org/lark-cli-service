process.env.NODE_ENV = 'production'
process.env.BABEL_ENV = 'production'
process.env.CI = false

if (process.env.FAAS_CONFIG_ENV) {
  let env = process.env.FAAS_CONFIG_ENV

  if (env.indexOf('production') >= 0) {
    if (env.indexOf('pre-production') >= 0) {
      env = 'pre_prod'
    } else {
      env = 'production'
    }
  } else if (env.indexOf('feat') >= 0) {
    env = 'feature'
  } else if (env.indexOf('staging') >= 0) {
    env = 'staging'
  } else {
    env = 'develop'
  }

  process.env.APP_ENV = env
}
if (!process.env.APP_ENV) {
  process.env.APP_ENV = 'production'
}

process.on('unhandledRejection', err => {
  throw err
})

const webpack = require('webpack')
const fs = require('fs-extra')
const chalk = require('chalk')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const FileSizeReporter = require('react-dev-utils/FileSizeReporter')
const printBuildError = require('react-dev-utils/printBuildError')
const configFactory = require('../webpack/webpack.config.build')
const { appBuild, appPublic, appHtml } = require('../variables/paths')

const {
  measureFileSizesBeforeBuild,
  printFileSizesAfterBuild,
} = FileSizeReporter

const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024

function build (previousFileSizes) {
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
        messages = formatWebpackMessages({
          errors: [err.message],
          warnings: [],
        })
      } else {
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
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
            'Most CI servers set it automatically.\n'
          )
        )

        return reject(new Error(messages.warnings.join('\n\n')))
      }

      return resolve({
        stats,
        previousFileSizes,
        warnings: messages.warnings,
      })
    })
  })
}

function copyPublicFolder () {
  fs.copySync(appPublic, appBuild, {
    dereference: true,
    filter: file => file !== appHtml,
  })
}

module.exports = () => {
  measureFileSizesBeforeBuild(appBuild)
    .then(previousFileSizes => {
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
      err => {
        console.log(chalk.red('Failed to compile.\n'))
        printBuildError(err)
        process.exit(1)
      }
    )
    .catch(err => {
      if (err && err.message) {
        console.log(err.message)
      }
      process.exit(1)
    })
}

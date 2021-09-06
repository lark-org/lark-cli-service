#!/usr/bin/env node
/* eslint-disable global-require */
const yargs = require('yargs')

// eslint-disable-next-line
yargs
  .command({
    command: 'start',
    describe: 'start a server',
    builder: {
      port: {
        description: 'port to start a server on',
        default: '3000',
        alias: 'p'
      },
      env: {
        description: 'project environment',
        default: 'develop',
        alias: 'e'
      }
    },
    handler: (args) => {
      process.env.APP_ENV = args.env
      const start = require('./commands/start')
      start(parseInt(args.port, 10) || 3000)
    }
  })
  .command({
    command: 'build',
    describe: 'compile file',
    handler: (args) => {
      const build = require('./commands/build')
      build(args)
    }
  })
  .demandCommand()
  .help()
  .option('version', {
    alias: 'v'
  }).argv

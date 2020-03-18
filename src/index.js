#!/usr/bin/env node
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
        alias: 'p',
      },
      env: {
        description: 'project environment',
        default: 'develop',
        alias: 'e',
      },
    },
    handler: args => {
      process.env.APP_ENV = args.env
      const start = require('./commands/start')
      start(parseInt(args.port, 10) || 3000)
    },
  })
  // 这里假定了 build 只用于 faas 里面，所以 env 就不允许使用者通过参数方式传入了
  .command({
    command: 'build',
    describe: 'compile file',
    handler: args => {
      const build = require('./commands/build')
      build()
    },
  })
  .demandCommand()
  .help()
  .option('version', {
    alias: 'v',
  })
  .argv

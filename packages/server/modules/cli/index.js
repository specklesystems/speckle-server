const path = require('path')
const yargs = require('yargs')
require('../../bootstrap')
const { logger } = require('@/logging/logging')

const execution = yargs
  .scriptName('yarn cli')
  .usage('$0 <cmd> [args]')
  .commandDir(path.resolve(__dirname, './commands'), { extensions: ['js', 'ts'] })
  .demandCommand()
  .fail((msg, err, yargs) => {
    if (!err) {
      // If validation error (no err instance) then just show help and show the message
      console.log(yargs.help())
      console.log('\n', msg)
    } else {
      // If actual app error occurred, show the msg, but don't show help info
      logger.error(err)
      console.log('\n', 'Specify --help for available options')
    }

    process.exit(1)
  })
  .help().argv

const promise = Promise.resolve(execution)
promise.then(() => {
  yargs.exit(0)
})

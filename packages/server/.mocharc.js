'use strict'

/** @type {import("mocha").MochaOptions} */
const config = {
  spec: ['modules/**/*.spec.js'],
  require: 'test/hooks.js',
  slow: 0,
  timeout: '10000',
  exit: true
}

module.exports = config

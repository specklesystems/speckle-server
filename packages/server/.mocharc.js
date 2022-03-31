'use strict'

/** @type {import("mocha").MochaOptions} */
const config = {
  spec: ['modules/**/*.spec.js'],
  require: 'test/hooks.js',
  slow: 0,
  // timeout: '15000',
  timeout: '1500000000000',
  exit: true
}

module.exports = config

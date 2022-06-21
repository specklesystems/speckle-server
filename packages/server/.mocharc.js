'use strict'

// RANDOM CHANGEEE

/** @type {import("mocha").MochaOptions} */
const config = {
  spec: ['modules/**/*.spec.js'],
  require: 'test/hooks.js',
  slow: 0,
  timeout: '15000',
  exit: true
}

module.exports = config

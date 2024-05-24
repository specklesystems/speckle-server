'use strict'

/** @type {import("mocha").MochaOptions} */
const config = {
  spec: ['modules/**/*.spec.js', 'modules/**/*.spec.ts', 'logging/**/*.spec.js'],
  require: ['ts-node/register', 'test/hooks.js'],
  slow: 0,
  timeout: '150000',
  exit: true
}

module.exports = config

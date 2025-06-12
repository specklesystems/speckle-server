const { resolve } = require('path')

/**
 * Use this to generate an entry for the Tailwind 'content' config key that will ensure
 * this library is scanned to prevent unnecessary purging
 * @returns {string[]}
 */
function tailwindContentEntries() {
  const currentLocation = __dirname
  return [
    resolve(currentLocation, '../dist', '**/*.{js,cjs,mjs}'),
    resolve(currentLocation, '../dist-cjs', '**/*.{js,cjs,mjs}')
  ]
}

module.exports = { tailwindContentEntries }

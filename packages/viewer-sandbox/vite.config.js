/**
 * @type {import('vite').UserConfig}
 */

import mkcert from 'vite-plugin-mkcert'

const config = {
  server: {
    host: '0.0.0.0',
    port: '3033',
    https: true
  },
  build: {
    target: 'esnext'
  },
  plugins: [mkcert()]
}

module.exports = config

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  server: {
    host: '0.0.0.0',
    port: '3033'
  },
  build: {
    target: 'esnext'
  }
}

module.exports = config

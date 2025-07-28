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
  },
  plugins: [
    {
      name: 'custom-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
          next()
        })
      }
    }
  ]
}

module.exports = config

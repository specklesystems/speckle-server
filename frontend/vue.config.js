module.exports = {
  pages: {
    setup: {
      entry: 'src/main-serversetup.js',
      title: 'Speckle Server Preflight Setup',
      template: 'public/setup.html',
      filename: 'setup.html'
    },
    app: {
      entry: 'src/main-frontend.js',
      title: 'Speckle!',
      template: 'public/app.html',
      filename: 'app.html'
    }
  },
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /\/app/, to: '/app.html' },
        { from: /\/setup/, to: '/setup.html' }
      ]
    }
  },
  "transpileDependencies": [
    "vuetify"
  ]
}
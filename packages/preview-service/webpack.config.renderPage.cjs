const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const path = require('path')
const yargs = require('yargs')
const env = yargs.argv.env

const filename = 'viewer'

let outputFile, mode

if (env === 'build') {
  mode = 'production'
  outputFile = filename + '.min.js'
} else {
  mode = 'development'
  outputFile = filename + '.js'
}

/**
 * @type {import('webpack').Configuration}
 */
const config = {
  mode,
  entry: path.resolve(path.join(__dirname, 'renderPage', 'src', 'app.js')),
  target: 'web',
  devtool: 'source-map',
  output: {
    path: path.resolve(path.join(__dirname, 'dist', 'public', 'render')),
    filename: outputFile
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js|\.ts|\.tsx)$/,
        use: {
          loader: 'babel-loader'
        },
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new HtmlWebpackPlugin({
      title: 'Speckle Viewer Example',
      template: 'renderPage/src/example.html',
      filename: 'index.html',
      favicon: 'renderPage/src/favicon.ico'
    })
  ],
  resolve: {
    modules: [
      path.resolve('../../node_modules'),
      path.resolve('./node_modules'),
      path.resolve('.renderPage/src')
    ],
    extensions: ['.json', '.js']
  },
  devServer: {
    contentBase: path.join(__dirname, 'example'),
    compress: false,
    port: 9000,
    serveIndex: true,
    writeToDisk: true
  }
}

module.exports = config

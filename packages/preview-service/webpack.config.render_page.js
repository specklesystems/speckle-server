/* global __dirname, require, module*/
const HtmlWebpackPlugin = require( 'html-webpack-plugin' )
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' )
const path = require( 'path' )
const yargs = require( 'yargs' )
const env = yargs.argv.env

let filename = 'viewer'

let outputFile, mode

if ( env === 'build' ) {
  mode = 'production'
  outputFile = filename + '.min.js'
} else {
  mode = 'development'
  outputFile = filename + '.js'
}

const config = {
  mode: mode,
  entry: path.resolve( __dirname + '/render_page/src/app.js' ),
  target: 'web',
  devtool: 'source-map',
  output: {
    path: path.resolve( __dirname + '/public/render' ) ,
    filename: outputFile,
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js|\.ts|\.tsx)$/,
        use: {
          loader: 'babel-loader',
        },
        exclude: /(node_modules|bower_components)/,
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin( { cleanStaleWebpackAssets: false } ),
    new HtmlWebpackPlugin( { title: 'Speckle Viewer Example', template: 'render_page/src/example.html', filename: 'index.html' } )
  ],
  resolve: {
    modules: [ path.resolve( './node_modules' ), path.resolve( '.render_page/src' ) ],
    extensions: [ '.json', '.js' ],
  },
  devServer: {
    contentBase: path.join( __dirname, 'example' ),
    compress: false,
    port: 9000,
    serveIndex: true,
    writeToDisk: true
  }
}

module.exports = config

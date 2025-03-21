// Conditionally change appRoot and packageRoot according to whether we're running from /dist/ or not (ts-node)
const path = require('path')
const isTsNode = !!process[Symbol.for('ts-node.register.instance')]
const appRoot = __dirname
const packageRoot = isTsNode ? appRoot : path.resolve(__dirname, '../')

module.exports = {
  appRoot,
  packageRoot
}

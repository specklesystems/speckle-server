module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        corejs: '3',
        targets: {
          node: '11'
        }
      }
    ]
  ],
  ignore: ['node_modules/**/*']
}

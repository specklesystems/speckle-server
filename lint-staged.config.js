const micromatch = require('micromatch')

module.exports = {
  '*.{js,ts,vue}': (files) => {
    const finalFiles = micromatch.not(files, [
      // Filter out files that start with a period, since they're ignored by default
      '**/.*',
      // Filter out .ignored suffix files
      '**/*.ignored.{ts,js,vue,tsx,jsx}'
    ])

    return 'eslint --cache --max-warnings=0 ' + finalFiles.join(' ')
  },
  '*.**': 'prettier --check --ignore-unknown'
}

const micromatch = require('micromatch')

const extList = ['ts', 'js', 'vue', 'tsx', 'jsx', 'json'].join(',')
module.exports = {
  '*.{js,ts,vue}': (files) => {
    const finalFiles = micromatch.not(files, [
      // Filter out files that start with a period, since they're ignored by default
      `**/.*.{${extList}}`,
      // Filter out .ignored suffix files
      `**/*.ignored.{${extList}}`
    ])

    return 'eslint --cache --max-warnings=0 ' + finalFiles.join(' ')
  },
  '*.**': 'prettier --check --ignore-unknown'
}

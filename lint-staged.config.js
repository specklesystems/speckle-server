module.exports = {
  '*.{js,ts,vue,cjs,mjs,cts,mts}': 'yarn eslint:projectwide',
  '*.**': 'prettier --check --ignore-unknown'
}

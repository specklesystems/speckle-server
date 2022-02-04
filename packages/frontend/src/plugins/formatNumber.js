import numeral from 'numeral'

export function formatNumber(value, max) {
  const num = numeral(value)
  const abs = Math.abs(max || num.value())

  switch (abs) {
    case abs < 1000:
      return num.value()
    case abs >= 1000 && abs <= 10000:
      return num.format('0.0a')
    default:
      return num.format('0a')
  }
}

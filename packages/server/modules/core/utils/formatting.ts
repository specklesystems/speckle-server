export const toMegabytesWith1DecimalPlace = (bytes: number) =>
  toNDecimalPlaces(bytes / 1024 / 1024, 1)
export const toNDecimalPlaces = (value: number, n: number) =>
  Math.round(value * Math.pow(10, n)) / Math.pow(10, n)

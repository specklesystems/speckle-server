export const toMegabytesWith1DecimalPlace = (bytes: number) =>
  Math.round((bytes * 10) / 1024 / 1024) / 10

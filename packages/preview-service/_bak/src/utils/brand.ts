declare const brand: unique symbol

export type Brand<T, TBrand extends string> = T & { [brand]: TBrand }

export const isCastableToBrand = <TBrand extends string>(
  val: string | undefined | null
): val is TBrand => {
  return !!val
}

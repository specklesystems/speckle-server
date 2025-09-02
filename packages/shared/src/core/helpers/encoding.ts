// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const safeParse = <Result = any>(
  json: string,
  guard?: (data: unknown) => data is Result
): Result | null => {
  try {
    const parsed = JSON.parse(json) as Result
    return guard ? (guard(parsed) ? parsed : null) : parsed
  } catch {
    return null
  }
}

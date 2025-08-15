export type KeyValuePair = {
  key: string
  value: unknown
  units?: string
  type?: string
  innerType?: string | null
  arrayLength?: number | null
  arrayPreview?: string | null
  backendPath?: string
}

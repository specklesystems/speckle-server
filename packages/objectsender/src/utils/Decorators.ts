import 'reflect-metadata'

const detachMetadataKey = Symbol('detach')
const chunkableMetadataKey = Symbol('chunkable')

export function Detach() {
  return Reflect.metadata(detachMetadataKey, true)
}

export function Chunkable(size: number) {
  return Reflect.metadata(chunkableMetadataKey, size)
}

export function isDetached(target: object, propertyKey: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const metadata = Reflect.getMetadata(detachMetadataKey, target, propertyKey)
  return metadata ? true : false
}

export function isChunkable(target: object, propertyKey: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const metadata = Reflect.getMetadata(chunkableMetadataKey, target, propertyKey)
  return metadata ? true : false
}

export function getChunkSize(target: object, propertyKey: string) {
  return Reflect.getMetadata(chunkableMetadataKey, target, propertyKey) as number
}

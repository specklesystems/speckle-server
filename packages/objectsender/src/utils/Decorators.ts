import 'reflect-metadata'

const detachMetadataKey = Symbol('detach')

export function Detach() {
  return Reflect.metadata(detachMetadataKey, true)
}

export function isDetached(target: object, propertyKey: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const metadata = Reflect.getMetadata(detachMetadataKey, target, propertyKey)
  return metadata ? true : false
}

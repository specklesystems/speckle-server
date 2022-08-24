import crypto from 'crypto'

export function md5(val: string): string {
  return crypto
    .createHash('md5')
    .update(val || '')
    .digest('hex')
}

export function base64Encode(val: string): string {
  const bufferObj = Buffer.from(val, 'utf8')
  return bufferObj.toString('base64')
}

export function base64Decode(val: string): string {
  const bufferObj = Buffer.from(val, 'base64')
  return bufferObj.toString('utf8')
}

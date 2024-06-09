import { md5 } from '@speckle/shared'
export { md5 }

export const base64Encode = (str: string): string => {
  if (process.server) {
    return Buffer.from(str).toString('base64')
  } else {
    return btoa(str)
  }
}

export const base64Decode = (str: string): string => {
  if (process.server) {
    return Buffer.from(str, 'base64').toString('utf8')
  } else {
    return atob(str)
  }
}

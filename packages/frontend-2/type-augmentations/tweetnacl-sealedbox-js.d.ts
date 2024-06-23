declare module 'tweetnacl-sealedbox-js' {
  export function seal(message: Uint8Array, publicKey: Uint8Array): Uint8Array
}

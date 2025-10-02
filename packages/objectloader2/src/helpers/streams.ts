type Reader<T> = {
  read(): Promise<{ done: boolean; value: T } | { done: true }>
  cancel?(reason?: unknown): Promise<void>
}

type BodyWithReader = {
  body:
    | {
        [Symbol.asyncIterator]?(): AsyncIterator<Uint8Array>
      }
    | ReadableStream<Uint8Array<ArrayBuffer>>
    | null
}

export function getBodyReader(resp: BodyWithReader): Reader<Uint8Array> {
  const body = resp.body
  if (!body) {
    throw new Error('response has no body')
  }

  if ('getReader' in body && typeof body.getReader === 'function') {
    return body.getReader()
  }

  if (typeof body[Symbol.asyncIterator] === 'function') {
    const iterator = body[Symbol.asyncIterator]!()
    let done = false

    const mockedReader: Reader<Uint8Array> = {
      async read() {
        if (done) {
          return { done: true, value: new Uint8Array(0) }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { value, done: itDone } = await iterator.next()
        done = !!itDone
        // Normalize ‒ value might be Buffer / Uint8Array / Buffer‐like
        let uv: Uint8Array
        if (value === null) {
          uv = new Uint8Array(0)
        } else if (value instanceof Uint8Array) {
          uv = value
        } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
          uv = new Uint8Array(value)
        } else if (typeof value === 'string') {
          uv = new TextEncoder().encode(value)
        } else {
          // Try a generic conversion
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          uv = new Uint8Array(value)
        }
        return { done, value: uv }
      },
      async cancel(reason) {
        if (typeof iterator.return === 'function') {
          await iterator.return(reason)
        }
      }
    }

    return mockedReader
  }

  throw new Error('response.body has neither getReader nor async iterator')
}

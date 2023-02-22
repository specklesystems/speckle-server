/**
 * This adjusts a browser ReadableStream to make it work similarly to Node streams, which further enables us to use the
 * same code to read both kinds of streams. We don't mutate the ReadableStream prototype cause this specific polyfill
 * might not work well in other circumstances (https://github.com/node-fetch/node-fetch/issues/387#issuecomment-417433509)
 *
 * See more: https://github.com/node-fetch/node-fetch/issues/754#issuecomment-602184022
 * @param {ReadableStream} stream
 */
export function polyfillReadableStreamForAsyncIterator(stream) {
  stream.iterator = async function* () {
    const reader = this.getReader()
    while (1) {
      const chunk = await reader.read()
      if (chunk.done) return chunk.value
      yield chunk.value
    }
  }
}

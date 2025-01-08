import { ensureError } from '@speckle/shared'
import { Transform, TransformCallback } from 'stream'

/**
 * A stream that converts database objects stream to "{id}\t{data_json}\n" stream or a json stream of obj.data fields
 */
class SpeckleObjectsStream extends Transform {
  simpleText: boolean
  isFirstObject: boolean

  constructor(simpleText: boolean) {
    super({ writableObjectMode: true })
    this.simpleText = simpleText

    if (!this.simpleText) this.push('[')
    this.isFirstObject = true
  }

  _transform(
    dbObj: { dataText: string; id: string; data?: Record<string, unknown> },
    _encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    let objData = dbObj.dataText
    if (objData === undefined) objData = JSON.stringify(dbObj.data)

    try {
      if (this.simpleText) {
        this.push(`${dbObj.id}\t`)
        this.push(objData)
        this.push('\n')
      } else {
        // JSON output
        if (!this.isFirstObject) this.push(',')
        this.push(objData)
        this.isFirstObject = false
      }
      callback()
    } catch (e) {
      callback(ensureError(e))
    }
  }

  _flush(callback: TransformCallback) {
    if (!this.simpleText) this.push(']')
    callback()
  }
}

export { SpeckleObjectsStream }

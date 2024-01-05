import { Transform } from 'stream'

// A stream that converts database objects stream to "{id}\t{data_json}\n" stream or a json stream of obj.data fields

type TransformCallback = (error?: Error | null, data?: unknown) => void
export class SpeckleObjectsStream extends Transform {
  private simpleText: boolean
  private isFirstObject: boolean

  constructor(simpleText: boolean) {
    super({ writableObjectMode: true })
    this.simpleText = simpleText

    if (!this.simpleText) this.push('[')
    this.isFirstObject = true
  }

  _transform(
    dbObj: { id: string; dataText: unknown; data: unknown },
    encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    let objData = dbObj.dataText
    if (objData === undefined) objData = JSON.stringify(dbObj.data)

    try {
      if (this.simpleText) {
        //create tab separated value data structure
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
      if (e === null || e instanceof Error) callback(e)
    }
  }

  _flush(callback: TransformCallback) {
    if (!this.simpleText) this.push(']')
    callback()
  }
}

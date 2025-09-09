import { ensureError } from '@speckle/shared'
import { filter } from 'compression'
import { omit, pick } from 'lodash-es'
import type { TransformCallback } from 'stream'
import { Transform } from 'stream'
import { object } from 'zod'

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

export const objectDataTransformFactory = ({
  attributeMask
}: {
  attributeMask?: { include: string[] } | { exclude: string[] }
}) => {
  let objectTransform: ((dataText: string) => string) | null
  if (attributeMask) {
    let objectFilter: (obj: unknown, props: string[]) => unknown
    let filteredAttributes: string[]
    if ('include' in attributeMask) {
      objectFilter = pick
      filteredAttributes = attributeMask.include
    }
    if ('exclude' in attributeMask) {
      objectFilter = omit
      filteredAttributes = attributeMask.exclude
    }
    objectTransform = (dataText: string) =>
      JSON.stringify(objectFilter(JSON.parse(dataText), filteredAttributes))
  }
  return new Transform({
    writableObjectMode: true,
    transform({ dataText, id }: { dataText: string; id: string }, _, callback) {
      try {
        const objectDataString = objectTransform ? objectTransform(dataText) : dataText
        callback(null, `${id}\t${objectDataString}\n`)
      } catch (err) {
        callback(ensureError(err))
      }
    }
  })
}

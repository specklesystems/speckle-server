import { BadRequestError } from '@/modules/shared/errors'
import { ensureError } from '@speckle/shared'
import Busboy from 'busboy'
import { Request } from 'express'
import { getFileSizeLimit } from '@/modules/blobstorage/services/management'

export const createBusboy = (req: Request) => {
  let busboy: Busboy.Busboy
  try {
    // Busboy does some validation of user input (headers) on creation
    busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: getFileSizeLimit() }
    })
    return busboy
  } catch (err) {
    throw new BadRequestError(
      err instanceof Error ? err.message : 'Error while uploading blob',
      ensureError(err, 'Unknown error while uploading blob')
    )
  }
}

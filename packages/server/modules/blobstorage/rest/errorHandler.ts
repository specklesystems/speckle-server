import type { Request, Response } from 'express'
import {
  NotFoundError,
  ResourceMismatch,
  BadRequestError
} from '@/modules/shared/errors'
import { ensureError } from '@speckle/shared'

type ErrorHandler = (
  req: Request,
  res: Response,
  callback: (req: Request, res: Response) => Promise<void>
) => Promise<void>
export const errorHandler: ErrorHandler = async (req, res, callback) => {
  try {
    await callback(req, res)
  } catch (err) {
    //TODO we can probably delegate to the default error handler, but need to verify where this is called and whether we can refactor the callbacks
    if (err instanceof NotFoundError) {
      res.status(404).send({ error: err.message })
    } else if (err instanceof ResourceMismatch || err instanceof BadRequestError) {
      res.status(400).send({ error: err.message })
    } else {
      res.status(500).send({ error: ensureError(err, 'Unknown error').message })
    }
  }
}

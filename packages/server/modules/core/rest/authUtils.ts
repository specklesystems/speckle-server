'use strict'
import { validateScopes, authorizeResolver } from '@/modules/shared'
import type { Request } from 'express'
import { getStream } from '../services/streams'
import { Roles, Scopes } from '@speckle/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'

export async function validatePermissionsReadStream(streamId: string, req: Request) {
  const stream = await getStream({ streamId, userId: req.context.userId })
  if (stream?.isPublic) return { result: true, status: 200 }

  try {
    await throwForNotHavingServerRole(req.context, Roles.Server.Guest)
  } catch (err) {
    return { result: false, status: 401 }
  }

  if (!stream) return { result: false, status: 404 }

  if (!stream.isPublic && req.context.auth === false) {
    return { result: false, status: 401 }
  }

  if (!stream.isPublic) {
    try {
      await validateScopes(req.context.scopes, Scopes.Streams.Read)
    } catch (err) {
      return { result: false, status: 401 }
    }

    try {
      await authorizeResolver(req.context.userId, streamId, Roles.Stream.Reviewer)
    } catch (err) {
      return { result: false, status: 401 }
    }
  }
  return { result: true, status: 200 }
}

export async function validatePermissionsWriteStream(streamId: string, req: Request) {
  if (!req.context || !req.context.auth) {
    return { result: false, status: 401 }
  }

  try {
    await throwForNotHavingServerRole(req.context, Roles.Server.Guest)
  } catch (err) {
    return { result: false, status: 401 }
  }

  try {
    await validateScopes(req.context.scopes, Scopes.Streams.Write)
  } catch (err) {
    return { result: false, status: 401 }
  }

  try {
    await authorizeResolver(req.context.userId, streamId, Roles.Stream.Contributor)
  } catch (err) {
    return { result: false, status: 401 }
  }

  return { result: true, status: 200 }
}

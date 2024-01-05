'use strict'
import { getServerOrigin, getServerVersion } from '@/modules/shared/helpers/envHelper'
import {
  ScopesRecord,
  ServerConfigRecord,
  ServerInfo,
  UserRolesRecord
} from '@/modules/core/helpers/types'
import {
  UserRoles as UserRolesSchema,
  Scopes as ScopesSchema,
  ServerConfig as ServerConfigSchema
} from '@/modules/core/dbSchema'

const Roles = () => UserRolesSchema.knex<UserRolesRecord[]>()
const Scopes = () => ScopesSchema.knex<ScopesRecord[]>()
const Info = () => ServerConfigSchema.knex<ServerConfigRecord[]>()

export type ServerInfoParams = {
  name: string
  company: string
  description: string
  adminContact: string
  termsOfService: string
  inviteOnly: boolean
  guestModeEnabled: boolean
}

export async function getServerInfo(): Promise<ServerInfo> {
  const serverInfo = await Info().select('*').first()
  serverInfo.version = getServerVersion()
  serverInfo.canonicalUrl = getServerOrigin()
  return serverInfo
}

export async function getAllScopes() {
  return await Scopes().select('*')
}

export async function getPublicScopes() {
  return await Scopes().select('*').where({ public: true })
}

export async function getAllRoles() {
  return await Roles().select('*')
}

export async function getPublicRoles() {
  return await Roles().select('*').where({ public: true })
}

export async function updateServerInfo({
  name,
  company,
  description,
  adminContact,
  termsOfService,
  inviteOnly,
  guestModeEnabled
}: ServerInfoParams) {
  const serverInfo = await Info().select('*').first()
  if (!serverInfo)
    return await Info().insert({
      name,
      company,
      description,
      adminContact,
      termsOfService,
      inviteOnly,
      guestModeEnabled,
      completed: true
    })
  else
    return await Info().where({ id: 0 }).update({
      name,
      company,
      description,
      adminContact,
      termsOfService,
      inviteOnly,
      guestModeEnabled,
      completed: true
    })
}

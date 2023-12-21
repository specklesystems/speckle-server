'use strict'
import knex from '@/db/knex'
import { getServerOrigin, getServerVersion } from '@/modules/shared/helpers/envHelper'

const Roles = () => knex('user_roles')
const Scopes = () => knex('scopes')
const Info = () => knex('server_config')

export type ServerInfoParams = {
  name: string
  company: string
  description: string
  adminContact: string
  termsOfService: string
  inviteOnly: boolean
  guestModeEnabled: boolean
}

/**
 * @returns {Promise<import('@/modules/core/helpers/types').ServerInfo>}
 */
export async function getServerInfo() {
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

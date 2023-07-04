import { Command, defaultCommand } from '../types/command'

export type InitLocalAccounts = Command

export const initLocalAccounts: InitLocalAccounts = {
  ...defaultCommand,
  name: 'init_local_accounts',
  data: {}
}

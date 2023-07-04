import { Command, defaultCommand } from '../types/command'

export type SendStream = Command

export const sendStream: SendStream = {
  ...defaultCommand,
  name: 'sendStream',
  data: {}
}

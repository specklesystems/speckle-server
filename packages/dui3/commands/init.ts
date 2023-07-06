import { Command, defaultCommand } from '../types/command'

export type Init = Command

export const init: Init = {
  ...defaultCommand,
  name: 'init',
  data: {}
}

import dbg from 'debug'

const debug = dbg('speckle')

export const startupDebug = debug.extend('startup')
export const shutdownDebug = debug.extend('shutdown')
export const modulesDebug = debug.extend('modules')
export const notificationsDebug = debug.extend('notifications')
export const cliDebug = debug.extend('cli')
export const errorDebug = debug.extend('error')

import pino from 'pino'

export const Logger = pino({
  level: process.env.PINO_LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label }
    }
  }
})

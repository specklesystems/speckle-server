class SpeckleForbiddenError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SpeckleForbiddenError'
  }
}

module.exports = { SpeckleForbiddenError }

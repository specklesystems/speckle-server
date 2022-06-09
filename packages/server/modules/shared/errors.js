class SpeckleForbiddenError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SpeckleForbiddenError'
  }
}

class SpeckleUnauthorizedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SpeckleForbiddenError'
  }
}

class SpeckleNotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SpeckleNotFoundError '
  }
}

class SpeckleResourceMismatch extends Error {
  constructor(message) {
    super(message)
    this.name = 'SpeckleResourceMismatch '
  }
}
module.exports = {
  SpeckleForbiddenError,
  SpeckleUnauthorizedError,
  SpeckleNotFoundError,
  SpeckleResourceMismatch
}

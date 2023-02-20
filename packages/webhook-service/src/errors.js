const { VError } = require('verror')

class WebhookError extends VError {
  constructor(err, message, responseCode, responseBody) {
    const options = { name: new.target.name }
    super(options, message)
    this.cause = err
    this.responseCode = responseCode
    this.responseBody = responseBody
  }
}

module.exports = WebhookError

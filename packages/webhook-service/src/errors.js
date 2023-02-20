const { VError } = require('verror')

class WebhookError extends VError {
  constructor(err, message, responseCode, responseBody) {
    const options = { cause: err, name: new.target.name }
    super(options, message)
    this.responseCode = responseCode
    this.responseBody = responseBody
  }
}

module.exports = WebhookError

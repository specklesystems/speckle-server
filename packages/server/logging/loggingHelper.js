const filterSensitiveVariables = (variables) => {
  return Object.entries(variables).reduce((acc, [key, val]) => {
    if (typeof val === 'object') {
      acc[key] = filterSensitiveVariables(val)
      return acc
    }

    if (
      ['email', 'emailaddress', 'email_address', 'emails'].includes(
        key.toLocaleLowerCase()
      )
    ) {
      acc[key] = '[REDACTED]'
      return acc
    }

    acc[key] = val
    return acc
  }, {})
}

module.exports = {
  filterSensitiveVariables
}

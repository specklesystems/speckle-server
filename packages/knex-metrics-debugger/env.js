const getMaximumNumberOfConnections = () =>
  parseInt(process.env.POSTGRES_MAX_CONNECTIONS_SERVER, 10) || 2

module.exports = {
  getMaximumNumberOfConnections
}

const getIpFromRequest = (req) => {
  let ip
  try {
    ip = req.headers['cf-connecting-ip'] || req.ip || req.connection.remoteAddress || ''
  } catch {
    ip = ''
  }
  const ignorePrefixes = ['192.168.', '10.', '127.', '172.1', '172.2', '172.3', '::']

  for (const ipPrefix of ignorePrefixes)
    if (ip.startsWith(ipPrefix) || ip === '') return null
  return ip
}

module.exports = { getIpFromRequest }

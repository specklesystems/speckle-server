import net from 'net'

export async function getFreeServerPort() {
  return new Promise((res) => {
    const srv = net.createServer()
    srv.listen(0, () => {
      const port = (srv?.address() as net.AddressInfo).port
      srv.close(() => res(port))
    })
  })
}

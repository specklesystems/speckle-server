import _sodium from 'libsodium-wrappers'

import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'generate-key-pair',
  describe: 'Generate a public private key pair for lisodium box encryption',

  handler: async () => {
    console.log('generating a key pair')
    await _sodium.ready
    const sodium = _sodium
    const { publicKey, privateKey } = sodium.crypto_box_keypair()
    const out = {
      publicKey: Buffer.from(publicKey).toString('base64'),
      privateKey: Buffer.from(privateKey).toString('base64')
    }
    console.log('generated', out)
  }
}

export = command

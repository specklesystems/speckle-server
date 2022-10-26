import { getNuxtViteConfig } from '../lib/fake-nuxt-env/utils/nuxtViteConfig.mjs'

async function main() {
  console.log('Extracting nuxt vite config...\n\n')
  const config = await getNuxtViteConfig()
  console.log('Config resolved!\n\n\n')
  console.log(config)
}

main()

import { addAliases } from 'module-alias'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

addAliases({
  '@/': __dirname
})
dotenv.config()

/* eslint-disable no-restricted-imports */
import { printSchema } from 'graphql'
import type { CodegenConfig } from '@graphql-codegen/cli'
import { generate } from '@graphql-codegen/cli'
import { graphSchema } from '@/modules'
import baseConfig from '../../../codegen'
import watcher from '@parcel/watcher'
import { resolve } from 'path'
import { getModuleDirectory } from '@speckle/shared/environment/node'

/**
 * CUSTOM GQL CODEGEN BINARY, TO SUPPORT TOP-LEVEL AWAIT WHICH WE NEED TO BUILD OUR SCHEMA
 */

const watch = process.argv.includes('--watch') || process.argv.includes('-w')
const __dirname = getModuleDirectory(import.meta)
const root = resolve(__dirname, '../../../')

const getSchemaString = async () => {
  const schema = await graphSchema()
  const schemaString = printSchema(schema)
  return schemaString
}

const getUpdatedConfig = async () => {
  const schemaString = await getSchemaString()
  const config: CodegenConfig = {
    ...baseConfig,
    schema: [schemaString],
    watch: false // we handle it ourselves
  }
  return config
}

if (!watch) {
  await generate(await getUpdatedConfig())
  process.exit(0)
} else {
  // Watch for changes in the schema and regenerate
  console.log('Watching for schema changes: ' + root)
  await watcher.subscribe(
    root,
    async (err) => {
      if (err) {
        console.error('Error watching files:', err)
        return
      }

      console.log(`Files changed, regenerating schema...`)
      await generate(await getUpdatedConfig())
    },
    {
      ignore: [
        'dist',
        'coverage',
        'node_modules',
        'reports',
        'modules/core/graph/generated/**/*',
        'modules/cross-server-sync/graph/generated/**/*',
        'test/graphql/generated/**/*'
      ]
    }
  )
}

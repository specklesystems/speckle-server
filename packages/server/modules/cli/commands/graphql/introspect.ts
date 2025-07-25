import type { CommandModule } from 'yargs'
import { cliLogger as logger } from '@/observability/logging'
import * as ModulesSetup from '@/modules/index'
import { printSchema } from 'graphql/utilities'
import fs from 'node:fs/promises'
import path from 'node:path'

const command: CommandModule<unknown, { file: string }> = {
  command: 'introspect [file]',
  describe: 'Introspect server schema and save it to file',
  builder: {
    file: {
      describe:
        'Path to .graphql file that the introspection result should be dumped to',
      type: 'string',
      default: './introspected-schema.graphql'
    }
  },
  handler: async ({ file }) => {
    logger.info('Loading GQL schema...')
    const schema = await ModulesSetup.graphSchema()
    const schemaString = printSchema(schema)

    logger.info(`Saving to "${file}"...`)
    const absolutePath = path.isAbsolute(file)
      ? file
      : path.resolve(process.cwd(), file)

    await fs.writeFile(absolutePath, schemaString)
  }
}

export = command

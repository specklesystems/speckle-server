import type { CodegenConfig } from '@graphql-codegen/cli'
import dotenv from 'dotenv'
import { trimEnd } from 'lodash'

// make nuxt env vars available here
dotenv.config()

const getApiOrigin = () => {
  const backendApiOrigin = process.env.NUXT_PUBLIC_BACKEND_API_ORIGIN
  if (backendApiOrigin?.length) return backendApiOrigin

  const apiOrigin = process.env.NUXT_PUBLIC_API_ORIGIN
  if (apiOrigin?.length) return apiOrigin

  return 'http://127.0.0.1:3000'
}

const config: CodegenConfig = {
  schema: `${trimEnd(getApiOrigin(), '/')}/graphql`,
  documents: ['{lib,components,layouts,pages,middleware}/**/*.{vue,js,ts}'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './lib/common/generated/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
        fragmentMasking: false,
        dedupeFragments: true,
        scalars: {
          JSONObject: '{}',
          DateTime: 'string'
        }
      },
      presetConfig: {
        fragmentMasking: false,
        dedupeFragments: true
      },
      plugins: ['./tools/gqlCacheHelpersCodegenPlugin.js']
    }
  }
}

export default config

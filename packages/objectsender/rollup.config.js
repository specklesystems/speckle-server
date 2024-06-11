import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import { babel } from '@rollup/plugin-babel'
import clean from 'rollup-plugin-delete'
import pkg from './package.json'
import typescript2 from 'rollup-plugin-typescript2'

const isProd = process.env.NODE_ENV === 'production'
const isExample = !!process.env.EXAMPLE_BUILD

const sourcemap = isProd ? false : 'inline'

/**
 * Build config
 * @param {boolean} isWebBuild If set to true will generate a web-ready config with everything bundled into a single file
 * @returns {import('rollup').RollupOptions}
 */
function buildConfig(isWebBuild = false) {
  /** @type {import('rollup').RollupOptions} */
  const config = {
    input: 'src/index.ts',
    output: [
      {
        file: isWebBuild
          ? 'examples/browser/objectsender.web.js'
          : 'dist/objectsender.esm.js',
        format: 'esm',
        sourcemap,
        exports: 'auto'
      },
      ...(isWebBuild
        ? []
        : [
            {
              file: 'dist/objectsender.js',
              format: 'cjs',
              sourcemap,
              exports: 'auto'
            }
          ])
    ],
    plugins: [
      typescript2({
        tsconfigOverride: {
          sourceMap: sourcemap
        },
        tsconfig: './tsconfig.build.json'
      }),
      ...(isWebBuild
        ? [
            // Bundling in all deps in web build
            commonjs(),
            nodeResolve({ browser: true })
          ]
        : [
            // Cleaning dir only inside 'dist'
            clean({ targets: 'dist/*' })
          ]),
      babel({ babelHelpers: 'bundled' }),
      ...(isProd ? [terser()] : [])
    ],
    external: isWebBuild
      ? undefined
      : // In non web build we don't want to bundle in any deps
        Object.keys(pkg.dependencies || {}).map((d) => new RegExp(`^${d}(\\/.*)?$`))
  }

  return config
}

const config = isExample ? buildConfig(true) : buildConfig()
export default config

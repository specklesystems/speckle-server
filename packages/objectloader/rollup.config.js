import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import { babel } from '@rollup/plugin-babel'
import clean from 'rollup-plugin-delete'
import pkg from './package.json'

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
    input: 'src/index.js',
    output: [
      {
        file: isWebBuild
          ? 'examples/browser/objectloader.web.js'
          : 'dist/objectloader.esm.js',
        format: 'esm',
        sourcemap,
        exports: 'default'
      },
      ...(isWebBuild
        ? []
        : [
            {
              file: 'dist/objectloader.cjs',
              format: 'cjs',
              sourcemap,
              exports: 'default'
            }
          ])
    ],
    plugins: [
      ...(isWebBuild
        ? [
            // Bundling in all deps in web build
            commonjs(),
            nodeResolve()
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

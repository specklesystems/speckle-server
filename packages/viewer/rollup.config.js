import { terser } from 'rollup-plugin-terser'
import clean from 'rollup-plugin-delete'
import pkg from './package.json'
// import typescript2 from 'rollup-plugin-typescript2'
import typescript from '@rollup/plugin-typescript'
import { babel } from '@rollup/plugin-babel'
import { DEFAULT_EXTENSIONS } from '@babel/core'
import image from '@rollup/plugin-image'

const isProd = process.env.NODE_ENV === 'production'
const sourcemap = isProd ? false : 'inline'

/** @type {import('rollup').RollupOptions} */
const config = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap
    }
  ],
  plugins: [
    clean({ targets: 'dist/*' }),
    image(),
    // typescript2({
    //   tsconfigOverride: {
    //     sourceMap: sourcemap
    //   },
    //   tsconfig: './tsconfig.build.json'
    // }),
    typescript({
      tsconfig: './tsconfig.build.json',
      compilerOptions: {
        ...(sourcemap ? { inlineSourceMap: true } : { sourceMap: false })
      }
    }),
    babel({
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
      babelHelpers: 'bundled',
      configFile: './.babelrc'
    }),
    ...(isProd ? [terser()] : [])
  ],
  // Externalizing all deps, we don't want to bundle them in cause this is a library
  external: Object.keys(pkg.dependencies || {}).map((d) => new RegExp(`^${d}(\\/.*)?$`))
}

export default config

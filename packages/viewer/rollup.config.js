import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import { babel } from '@rollup/plugin-babel';
import clean from 'rollup-plugin-delete';
import pkg from './package.json';
import typescript from '@rollup/plugin-typescript';

const isProd = process.env.NODE_ENV === 'production';
const isExample = !!process.env.EXAMPLE_BUILD;

const sourcemap = isProd ? false : 'inline';

/**
 * Build config
 * @param {boolean} isWebBuild If set to true will generate a web-ready config with everything bundled into a single file
 * @returns {import('rollup').RollupOptions}
 */
function buildConfig(isWebBuild = false) {
    /** @type {import('rollup').RollupOptions} */
    const config = {
        input: isWebBuild ? 'src/example.js' : 'src/index.js',
        output: [
            {
                file: isWebBuild ? 'example/speckleviewer.web.js' : 'dist/speckleviewer.esm.js',
                format: 'esm',
                sourcemap
            },
            ...(isWebBuild
                ? []
                : [
                      {
                          file: 'dist/speckleviewer.js',
                          format: 'cjs',
                          sourcemap
                      }
                  ])
        ],
        plugins: [
            ...(isWebBuild
                ? [
                      // Bundling in all deps in web build
                      commonjs(),
                      nodeResolve(),
                      typescript()
                  ]
                : [
                      // Cleaning dir only inside dist
                      clean({ targets: 'dist/*' }),
                      typescript({
                          include: 'src/**/*.{js,ts}'
                      })
                  ]),
            babel({ babelHelpers: 'bundled' }),
            ...(isProd ? [terser()] : [])
        ],
        external: isWebBuild
            ? undefined
            : // In non web build we don't want to bundle in any deps
              Object.keys(pkg.dependencies || {}).map((d) => new RegExp(`^${d}(\\/.*)?$`))
    };

    return config;
}

const config = isExample ? buildConfig(true) : buildConfig();
export default config;

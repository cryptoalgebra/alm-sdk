/* eslint-disable import/no-extraneous-dependencies */

import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import pkg from './package.json';

const moduleName = pkg.name.replace(/^@.*\//, '');
const inputFileName = 'src/index.ts';
const { author } = pkg;
const banner = `
  /**
   * @license
   * author: ${author}
   * ${moduleName}.js v${pkg.version}
   * Released under the ${pkg.license} license.
   */
`;

export default {
  input: inputFileName,
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      banner,
    },
    {
      file: pkg.module,
      format: 'es',
      banner,
      inlineDynamicImports: true,
    },
  ],
  external: [
    'ethers',
    'graphql-request',
    'bignumber.js',
    'node-cache',
    '@algebra/sdk',
  ],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs({
      transformMixedEsModules: true,
    }),
    nodePolyfills(),
    typescript({
      exclude: ['tests/*.spec.ts'],
    }),
    json(),
  ],
};

/* eslint-disable import/no-extraneous-dependencies */

import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
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
    },
  ],
  plugins: [
    typescript({
      exclude: ['tests/*.spec.ts'],
    }),
    json(),
  ],
};

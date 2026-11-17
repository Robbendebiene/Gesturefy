import json from '@rollup/plugin-json';
// required to resolve absolute paths to current dir
const resolveId = importee => importee[0] === '/' ? `${process.cwd()}${importee}` : null

export default {
  input: 'core/content.mjs',
  output: {
    file: 'core/bundle/content.bundle.js',
    format: 'cjs'
  },
  plugins: [
    { resolveId }, json({ namedExports: false }),
  ]
};

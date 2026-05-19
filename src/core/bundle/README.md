The `content.bundle.js` file is a bundled version of `src/core/content.mjs` and is required until Webextensions support ES6 modules in content scripts. It was created with the nodejs module [rollupjs](https://rollupjs.org).

To recreate the file please follow the steps below:

1. install nodejs and npm
2. install rollupjs (`npm install --save-dev rollup`)
3. install rollup json plugin (`npm install --save-dev @rollup/plugin-json`)
4. move to the Gesturefy root directory (`src`)
5. create a file called `rollup.config.js` in the Gesturefy root directory (`src`)
6. insert the following code into the file and save it:
    ```js
    import json from '@rollup/plugin-json';
    // required to resolve absolute paths to current dir
    const resolveId = (importee, importer) => importee[0] === '/' ? __dirname + importee : null

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
    ```

7. run: `rollup -c rollup.config.js --bundleConfigAsCjs` from the Gesturefy root directory (`src`)
8. the file `content.bundle.js` should have been created in the `src/bundle` directory

___

Related bugs:
- https://bugzilla.mozilla.org/show_bug.cgi?id=1451545
- https://bugzilla.mozilla.org/show_bug.cgi?id=1536094

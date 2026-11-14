The `content.bundle.js` file is a bundled version of `src/core/content.mjs` and is required until Webextensions support ES6 modules in content scripts. It was created with the nodejs module [rollupjs](https://rollupjs.org).

To recreate the file please follow the steps below:

1. install nodejs and npm
2. install rollupjs (`npm install --save-dev rollup`)
3. install rollup json plugin (`npm install --save-dev @rollup/plugin-json`)
4. run: `rollup -c core/bundle/rollup.config.mjs` from inside Gesturefy's root directory (`src`)
5. the file `content.bundle.js` should have been created in the `src/core/bundle` directory

___

Related bugs:
- https://bugzilla.mozilla.org/show_bug.cgi?id=1451545
- https://bugzilla.mozilla.org/show_bug.cgi?id=1536094

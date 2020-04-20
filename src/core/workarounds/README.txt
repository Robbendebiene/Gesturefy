The content.bundle.js file is a bundled version of src/core/content.js and is required until Webextensions support ES6 modules in content scripts.
(Related bugs https://bugzilla.mozilla.org/show_bug.cgi?id=1451545 or https://bugzilla.mozilla.org/show_bug.cgi?id=1536094)

This file was created with a nodejs module called "rollupjs" (https://rollupjs.org).
To recreate the file please follow the steps below:

1. install nodejs and npm
2. install rollupjs (npm install --global rollup)
3. move to the Gesturefy root directory (src)
4. install the plugin (npm install rollup-plugin-includepaths) note: you need to install this package localy
5. create a file called "rollup.config.js" in the Gesturefy root directory (src)
6. insert the following config into the file and save it:

import includePaths from 'rollup-plugin-includepaths';

export default {
  input: 'core/content.js',
  output: {
    file: 'core/workarounds/bundle.js',
    format: 'cjs'
  },
  plugins: [ includePaths({
    paths: ['core', 'core/modules'],
    include: {
    '/core/commons.js': 'core/commons.js',
    '/core/config-manager.js': 'core/config-manager.js',
    "/core/modules/mouse-gesture-controller.js": "core/modules/mouse-gesture-controller.js",
    "/core/modules/rocker-gesture-controller.js": "core/modules/rocker-gesture-controller.js",
    "/core/modules/wheel-gesture-controller.js": "core/modules/wheel-gesture-controller.js",
    "/core/pattern-tools.js": "core/pattern-tools.js",
    "/core/views/mouse-gesture-view/mouse-gesture-view.js": "core/views/mouse-gesture-view/mouse-gesture-view.js",
    "/core/views/popup-command-view/popup-command-view.js": "core/views/popup-command-view/popup-command-view.js",
    "/core/workarounds/user-script-controller.content.js": "core/workarounds/user-script-controller.content.js"
    }
  }) ]
};

7. run: rollup -c rollup.config.js from the Gesturefy root directory (src)
8. the file bundle.js should have been created in the src/workarounds directory

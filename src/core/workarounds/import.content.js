'use strict'


console.log("import content");

import(browser.runtime.getURL("/core/content.js")).then((e) => {
    console.log(e);
});
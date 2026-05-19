"use strict";

/**
 * Build API function object.
 * This is injected before every user script.
 *
 * Use "var" instead of "const" to allow for reassignment.
 * This is necessary because the variable is declared in global scope
 * and therefore will be already present in subsequent user script executions.
 **/
var API = (() => {
  function apiCallHandler(nameSpace, functionName, ...args) {
    return browser.runtime.sendMessage({
      "nameSpace": nameSpace,
      "functionName": functionName,
      "parameters": args
    });
  }

  // NOTE: When adding an API call here, it must also be added to the
  // ALLOWED_API_CALLS object in background.mjs
  return {
    tabs: {
      query: apiCallHandler.bind(null, "tabs", "query"),
      create: apiCallHandler.bind(null, "tabs", "create"),
      remove: apiCallHandler.bind(null, "tabs", "remove"),
      update: apiCallHandler.bind(null, "tabs", "update"),
      duplicate: apiCallHandler.bind(null, "tabs", "duplicate"),
      goBack: apiCallHandler.bind(null, "tabs", "goBack"),
      goForward: apiCallHandler.bind(null, "tabs", "goForward"),
      move: apiCallHandler.bind(null, "tabs", "move")
    },
    windows: {
      get: apiCallHandler.bind(null, "windows", "get"),
      getCurrent: apiCallHandler.bind(null, "windows", "getCurrent"),
      create: apiCallHandler.bind(null, "windows", "create"),
      remove: apiCallHandler.bind(null, "windows", "remove"),
      update: apiCallHandler.bind(null, "windows", "update"),
    }
  }
})();

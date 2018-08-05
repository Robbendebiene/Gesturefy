{
  let Data = null;
  const restoreButton = document.getElementById("restoreGestures");
  const restoreInfo = document.getElementById("restoreInfo");

  const fetchStorage = browser.storage.local.get();
  fetchStorage.then((data) => {
    if (data && data.oldGestures && data.oldGestures.length) {
      Data = data;
      restoreButton.style.setProperty("display", "block");
      restoreButton.onclick = restoreOldGestures;
      restoreInfo.style.setProperty("display", "block");
    }
  });


  function restoreOldGestures (gestures) {
    const permissionRequest = browser.permissions.request({
      permissions: Data.requiredPermissions,
    });
    permissionRequest.then((granted) => {
      if (granted) {
        const fetchStorage = browser.storage.sync.get();
        fetchStorage.then((config) => {
          config.Gestures.push(...Data.oldGestures);
          browser.storage.sync.set(config).then(() => {
            restoreButton.disabled = true;
            alert("Gestures successfully restored.");
            browser.storage.local.clear();
          });
        });
      }
    });
  }
}

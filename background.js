// first time initialisation
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ notes: {} }, () => {
      console.log("Initialized empty notes array in local storage.");
    });

    chrome.storage.sync.set({ noteCounter: 0 }, () => {
        console.log("Updated noteCounter to 0");
    });
  });
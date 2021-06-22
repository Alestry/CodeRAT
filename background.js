//Initialize variables
let loggingstatus = false;


//Initialize the storage and add loggingstatus to it
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ loggingstatus });
});
//Initialize variables
let loggingstatus = false;
let buttonColor = "lime";
let buttonInnerText = "Start Logging";


//Initialize the storage and add loggingstatus, buttonColor and buttonInnerText to it
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ loggingstatus, buttonColor, buttonInnerText });
});
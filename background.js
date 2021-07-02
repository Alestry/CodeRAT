//Initialize variables
let loggingstatus = false;
let loggingStartTime = 0;
let buttonColor = "lime";
let buttonInnerText = "Start Logging";
let currentTab = getCurrentTab();


//Initialize the storage and add loggingstatus, buttonColor and buttonInnerText to it
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ loggingstatus, loggingStartTime, buttonColor, buttonInnerText, currentTab });
});


//Function to get the current tab (this only works as a background script)
async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab.id;
}


//On active tab change, update the storage with the new active tab
chrome.tabs.onActivated.addListener(() => {
    currentTab = getCurrentTab();
    chrome.storage.sync.set({ currentTab });
});
//Function to get the current tab (this only works as a background script)
async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab.url;
}


//Initialize the variables and storage
chrome.runtime.onInstalled.addListener(() => {
    //Initialize variables
    let loggingstatus = false;
    let loggingStartTime = 0;
    let loggingFinished = false;
    let buttonColor = "lime";
    let buttonInnerText = "Start Logging";
    let logText = "";
    let currentTab = getCurrentTab();
    //Initialize storage
    chrome.storage.sync.set({ loggingstatus, loggingStartTime, loggingFinished, buttonColor, buttonInnerText, logText, currentTab });
});


//On active tab change, update the storage with the new active tab
chrome.tabs.onActivated.addListener(() => {
    currentTab = getCurrentTab();
    chrome.storage.sync.set({ currentTab });
});
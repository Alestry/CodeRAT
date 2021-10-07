//Function to get the current tab (this only works as a background script)
async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab.url;
}


//Initialize the variables and storage
chrome.runtime.onInstalled.addListener(() => {
    //Initialize variables
    //loggingstatus: bool, tracks whether the extension is currently enabled
    //sessionstatus: bool, tracks whether we are currently in the process of reviewing a pull request
    //loggingStartTime: int, tracks the absolute time when a pull request review session starts
    //logText: str, temporary storage for the current pull request review session log
    //fullLog: str, holds all of the pull request review session logs
    //currentURL: str, current URL
    //currentTab: -
    //fileTimers: 2D array, holds all of the separate [file id, file timer] pairs
    //currentFileTimer: array of str, holds the current [file id, file timer] pair
    //feedbackValue: str, tracks what kind of feedback was given at the end of a pull request review session (approve/comment/reject)
    //feedbackSubmitted: bool, tracks whether the feedback was actually submitted or just abandoned
    //rawData: array, holds all parameters for all sessions
    //  Index values:
    //  0: int, number of sessions
    //  1: array of int, session durations
    //  2: array of arrays of str, fileTimers arrays for sessions
    //  3: array of str, feedback values for sessions
    let loggingstatus = true;
    let sessionstatus = false;
    let loggingStartTime = 0;
    let logText = "";
    let fullLog = "";
    let currentURL = "";
    let currentTab = getCurrentTab();
    let fileTimers = [[], []];
    let currentFileTimer = ["", ""];
    let feedbackValue = "";
    let feedbackSubmitted = false;
    let rawData = [0, [], [[], []], []];
    //Initialize storage
    chrome.storage.sync.set({ loggingstatus, sessionstatus, loggingStartTime, logText, fullLog, currentURL, currentTab, fileTimers, currentFileTimer, feedbackValue, feedbackSubmitted, rawData });
});


//On active tab change, update the storage with the new active tab
/*chrome.tabs.onActivated.addListener(() => {
    currentTab = getCurrentTab();
    chrome.storage.sync.set({ currentTab });
});*/


//Listener for URL change
chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        if (changeInfo.url) {
            chrome.tabs.sendMessage(tabId, {
                message: "urlchange",
                url: changeInfo.url
            });
        }
    }
);
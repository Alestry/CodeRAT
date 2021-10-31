//Initialize the variables and storage
chrome.runtime.onInstalled.addListener(() => {
    //Initialize variables
    //loggingstatus: bool, tracks whether the extension is currently enabled
    //sessionstatus: bool, tracks whether we are currently in the process of reviewing a pull request
    //loggingStartTime: int, tracks the absolute time when a pull request review session starts
    //logText: str, temporary storage for the current pull request review session log
    //fullLog: str, holds all of the pull request review session logs
    //currentURL: str, current URL
    //sessionTabActive: bool, tracks whether the tab in which the current logging session is running is active or not
    //sessionTabInactiveStartTime: int, the absolute time when the current logging session's tab becomes inactive / unfocused
    //fileTimers: 2D array, holds all of the separate [file id, file timer] pairs
    //currentFileTimer: array of str, holds the current [file id, file timer] pair
    //feedbackValue: str, tracks what kind of feedback was given at the end of a pull request review session (approve/comment/reject)
    //reasonForRejection: str, tracks the reason that was given if the feedback was "Rejected"
    //feedbackSubmitted: bool, tracks whether the feedback was actually submitted or just abandoned
    let loggingstatus = true;
    let sessionstatus = false;
    let loggingStartTime = 0;
    let logText = "";
    let fullLog = "";
    let currentURL = "";
    let sessionTabActive = false;
    let sessionTabInactiveStartTime = 0;
    let fileTimers = [[], []];
    let currentFileTimer = ["", ""];
    let feedbackValue = "";
    let reasonForRejection = "";
    let feedbackSubmitted = false;
    //Initialize storage
    chrome.storage.sync.set({ loggingstatus, sessionstatus, loggingStartTime, logText, fullLog, currentURL, sessionTabActive, sessionTabInactiveStartTime, fileTimers, currentFileTimer, feedbackValue, reasonForRejection, feedbackSubmitted });
});


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
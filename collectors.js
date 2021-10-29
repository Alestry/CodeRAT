//Function to convert the Date
function getTimeStamp(date) {
    currentYear = date.getFullYear();
    currentMonth = date.getMonth() + 1;
    currentDay = date.getDate();
    currentHour = date.getHours();
    currentMinute = date.getMinutes();
    currentSeconds = date.getSeconds();
    currentMilliseconds = date.getTime() % 1000;
    processedTimeStamp = currentYear + "/" + currentMonth + "/" + currentDay + "-" + currentHour + ":" + currentMinute + ":" + currentSeconds + ":" + currentMilliseconds;
    return processedTimeStamp;
}


//Function to log the current timestamp with the current element
function log(element) {
    timeStamp = getTimeStamp(new Date());
    chrome.storage.sync.get("logText", ({ logText }) => {
        //logText += timeStamp + /*(23 - timeStamp.length + 4) **/ '    ' + 'CLICK: ' + element.constructor.name + ' - ' + element.nodeName + ' - ' + element.innerHTML.substring(0, 150) + '\n';
        console.log(timeStamp + /*(23 - timeStamp.length + 4) **/ '    ' + 'CLICK: ' + element.constructor.name + ' - ' + element.nodeName + ' - ' + element.innerHTML.substring(0, 150) + '\n');
        chrome.storage.sync.set({ logText });
    });
}


//Handle changes in the storage
function storageChangedListener(changed) {
    //Make a list of all changed items
    changedStorageItems = Object.keys(changed);

    //Go through all of the items in the storage
    for (item of changedStorageItems) {

        //Create a log message with a timestamp when a pull request review session is started/ended
        if (item == "sessionstatus") {
            oldItemValue = changed[item].oldValue;
            newItemValue = changed[item].newValue;

            //Log when a session starts/ends. The absolute time is needed in the storage to determine a pull request review session's length
            date = new Date();
            let absoluteTime = date.getTime();

            //Determine whether it is the start or the end of a pull request review session and log the appropriate message
            //Start
            if (oldItemValue == false && newItemValue == true) {
                loggingStartTime = absoluteTime;
                chrome.storage.sync.set({ loggingStartTime });
                chrome.storage.sync.get(["logText", "fileTimers", "currentFileTimer", "feedbackValue", "reasonForRejection", "feedbackSubmitted"], ({ logText, fileTimers, currentFileTimer, feedbackValue, reasonForRejection ,feedbackSubmitted }) => {
                    //Reset variables
                    let currentURL = location.href;
                    fileTimers = [[], []];
                    feedbackValue = "";
                    reasonForRejection = "";
                    feedbackSubmitted = false;
                    currentFileTimer = ["", ""];
                    logText = "EVENTS\n"
                    logText += "New logging session started at " + getTimeStamp(date) + "\nStarting URL:  " + currentURL + "\n";
                    chrome.storage.sync.set({ logText, currentURL, fileTimers, currentFileTimer, feedbackValue, reasonForRejection, feedbackSubmitted });
                });
            }

            //End
            if (oldItemValue == true && newItemValue == false) {
                chrome.storage.sync.get(["loggingStartTime", "logText", "fullLog", "fileTimers", "feedbackValue", "reasonForRejection", "feedbackSubmitted", "rawData"], ({ loggingStartTime, logText, fullLog, fileTimers, feedbackValue, reasonForRejection, feedbackSubmitted, rawData }) => {
                    timePassed = absoluteTime - loggingStartTime;
                    logText += "Ending URL:  " + location.href + "\nCurrent logging session ended at " + getTimeStamp(date) + " after " + timePassed + " ms\n";
                    logText += "\n\nANALYSIS"
                    logText += "\nTime spent on each file:\n";
                    //Janky things with fileTimers array, depending on its length (make it look nice)
                    if (fileTimers[0] == "") {
                        logText += "No files were opened in this logging session.\n";
                    } else if (fileTimers[1] == "") {
                        logText += fileTimers[0][0] + ": " + fileTimers[0][1] + " ms\n";
                    } else {
                        let i = 0;
                        let numberOfFiles = fileTimers.length;
                        let totalTime = 0;
                        let totalAccesses = 0;
                        for (i = 0; i < numberOfFiles; i++) {
                            logText += fileTimers[i][0] + ": " + fileTimers[i][1] + " ms across " + fileTimers[i][2] + " accesses\n";
                            totalTime += Number(fileTimers[i][1]);
                            totalAccesses += fileTimers[i][2];
                        }
                        let avgTime = totalTime / numberOfFiles;
                        let avgAcesses = totalAccesses / numberOfFiles;
                        logText += "\nTotal time spent accessing files: " + totalTime + " ms\n";
                        logText += "Average time per file: " + avgTime + " ms\n";
                        logText += "Total number of file access(es): " + totalAccesses + "\n";
                        logText += "Average number of accesses per file: " + avgAcesses+ "\n";
                    }
                    //Log the given feedback
                    if (feedbackValue != "" && feedbackSubmitted == true) {
                        logText += "\nFeedback: " + feedbackValue + "\n";
                        if(feedbackValue == "Rejected" && reasonForRejection != ""){
                            logText += "Reason for rejection: " + reasonForRejection + "\n";
                        }
                    } else {
                        logText += "\nNo feedback was given.\n";
                    }
                    //Add the parameters to the rawData structure
                    rawData = addToRawData(rawData, timePassed, feedbackValue, feedbackSubmitted);
                    //Temp: show rawData
                    //logText += "rawData: " + rawData;
                    fullLog += logText+ "\n----------\n";
                    chrome.storage.sync.set({ loggingStartTime, logText, fullLog, rawData });
                });
            }
        }
    }
}


//Get element clicked
document.addEventListener("click", function (e) {
    e = e || window.event;
    var target = e.target || e.srcElement;
    chrome.storage.sync.get("sessionstatus", ({ sessionstatus }) => {
        if (sessionstatus) {
            //Check if the click was to adjust the feedback value
            adjustFeedbackValue(target);
            //Check if the click was to submit feedback and handle it if so
            handleIfSubmit(target);
            //Log clicked element
            log(target);
        }
    });
}, false);


//Function to adjust the feedback value of a pull request review session (approved/comment/rejected)
function adjustFeedbackValue(element) {
    //Check if the clicked element was one of the radio buttons to give feedback
    //Based on heuristics
    let currentStr = element.innerHTML;
    let currentSubStr = element.innerHTML.substring(70, 76);
    if (currentSubStr == "approv" || currentStr == "Submit feedback and approve merging these changes." || currentSubStr == "commen" || currentStr == "Submit general feedback without explicit approval." || currentSubStr == "reject" || currentStr == "Submit feedback that must be addressed before merging.") {
        chrome.storage.sync.get("feedbackValue", ({ feedbackValue }) => {
            if (currentSubStr == "approv" || currentStr == "Submit feedback and approve merging these changes.") {
                feedbackValue = "Approved";
            }
            if (currentSubStr == "commen" || currentStr == "Submit general feedback without explicit approval.") {
                feedbackValue = "Commented";
            }
            if (currentSubStr == "reject" || currentStr == "Submit feedback that must be addressed before merging.") {
                feedbackValue = "Rejected";
            }
            chrome.storage.sync.set({ feedbackValue });
        });
    }
}


//Function to check whether a click was so submit feedback, if yes then handle it
//Also, force the end of a session
function handleIfSubmit(element) {
    if (element.innerHTML.substring(13, 26) == "Submit review") {
        chrome.storage.sync.get(["feedbackSubmitted", "sessionstatus", "sessionTabActive", "feedbackValue", "reasonForRejection"], ({ feedbackSubmitted, sessionstatus, sessionTabActive, feedbackValue, reasonForRejection }) => {
            //If feedback was submitted but nothing is written into feedbackValue, it means that the default option of "Comment" was selected
            if(feedbackValue == ""){
                feedbackValue = "Commented";
                chrome.storage.sync.set({feedbackValue});
            }
            //If the submitted feedback is Reject, store the reason for rejection
            if(feedbackValue == "Rejected"){
                reasonForRejection = document.getElementsByName("pull_request_review[body]")[0].value;
            }
            feedbackSubmitted = true;
            sessionstatus = false;
            sessionTabActive = false;
            chrome.storage.sync.set({ feedbackSubmitted, sessionstatus, sessionTabActive, reasonForRejection });
        });
    }
}


//Function which adds the current parameters to the rawData structure
function addToRawData(rawData, totalSessionTime, feedbackValue, feedbackSubmitted) {
    //get the total amount of sessions so far -> will use this number as the index for this session's data
    i = rawData[0];
    //add 1 to session counter at index 0
    rawData[0] += 1;
    //write this session's total duration into the array at index 1
    rawData[1][i] = totalSessionTime;
    //write this session's feedback value into the array at index 3 if feedback was given
    if (feedbackSubmitted) {
        rawData[3][i] = feedbackValue;
    } else {
        rawData[3][i] = "-";
    }
    //return rawData
    return rawData;
}


//Listener for changes in the storage
chrome.storage.onChanged.addListener(storageChangedListener);


//Listener for tab/url changes
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === "urlchange") {
        //If a url change was detected, call the handleUrlandTabChanged() function
        handleUrlAndTabChanges(request.url);
    }
});


//This is needed because the standerd Chrome URL listener cannot detect some page changes -> window.onhashchange covers these missing parts
//Not a nice way of doing it but due to the fact that this works on the entire window and not just the required tab, we first need to check if we are in the session's tab
//This should only be executed if we are indeed in the current logging session's tab
window.onhashchange = checkIfTabActiveForOnHashChange();


//Check if the current active tab is the one where the logging session is running. If yes, call the handleUrlAndTabChanges() function
function checkIfTabActiveForOnHashChange(){
    chrome.storage.sync.get("sessionTabActive", ({sessionTabActive})=>{
        if(sessionTabActive){
            handleUrlAndTabChanges(location.href);
        }
    });
}


//This is called both from window.onhashchange and chrome onMessage URL/tab change listener
function handleUrlAndTabChanges(url){
    chrome.storage.sync.get(["loggingstatus", "sessionstatus", "sessionTabActive", "logText", "fileTimers", "currentFileTimer"], ({ loggingstatus, sessionstatus, sessionTabActive, logText, fileTimers, currentFileTimer }) => {
        //Dynamically start a session
        if (loggingstatus) {
            let splitUrl = url.split("/");
            //Check URL based on heuristics
            if ((splitUrl[2] == "github.com" && splitUrl[5] == "pull") && !sessionstatus) {
                sessionstatus = true;
                sessionTabActive = true;
                //With starting a new session, add a listnener which checks when the tab in which the session is running becomes unfocused / focused
                document.addEventListener("visibilitychange", event => {
                    chrome.storage.sync.get(["logText", "sessionTabInactiveStartTime"], ({logText, sessionTabInactiveStartTime})=>{
                        if(document.visibilityState == "visible"){
                            sessionTabActive = true;
                            tempTabDate = new Date();
                            logText += "Tab became active at " + getTimeStamp(tempTabDate) + " after " + (tempTabDate.getTime() - sessionTabInactiveStartTime) + " ms\n";
                        } else{
                            sessionTabActive = false;
                            tempTabDate = new Date();
                            sessionTabInactiveStartTime = tempTabDate.getTime();
                            logText += "Tab became inactive at " + getTimeStamp(tempTabDate) + "\n";
                        }
                        chrome.storage.sync.set({logText, sessionTabInactiveStartTime});
                    })
                });
            }
            chrome.storage.sync.set({ sessionstatus });
        }

        //Handling files and file timers
        if (loggingstatus && sessionstatus) {
            let tempDate = new Date();
            let tempTime = tempDate.getTime();
            let timeStamp = getTimeStamp(tempDate);

            //End the current timer segment for a file if one is running and add it to the fileTimers array
            if (currentFileTimer[0] != "" && currentFileTimer[1] != "") {
                let currentFileId = currentFileTimer[0];
                let currentFileTime = currentFileTimer[1];
                let elapsedTime = tempTime - currentFileTime;
                //Check if the current file already has an entry in the fileTimers array
                let currentFileIdIndex = -1;
                let i = 0;
                for (i = 0; i < fileTimers.length; i++) {
                    if ((currentFileId != "") && (fileTimers[i][0] == currentFileId)) {
                        currentFileIdIndex = i;
                        break;
                    }
                }
                if (currentFileIdIndex != -1) {
                    //If the current file already has an existing timer in the array, add the current elapsed time to it and add add 1 to the visit counter
                    fileTimers[currentFileIdIndex][1] = (Number(fileTimers[currentFileIdIndex][1]) + elapsedTime).toString();
                    fileTimers[currentFileIdIndex][2] += 1;
                } else {
                    //If the current file does not yet have an existing timer in the array, create one, assign the current elapsed time and set its visit counter to 1
                    //Due to the manner of creation of the fileTimers array, we need to do some janky things to have a clean array in the end
                    if (fileTimers.length < 3) {
                        //"Stupid" case -> need to overwrite existing empty array entries
                        if (fileTimers[0] == "") {
                            //Subcase 1: no entries yet
                            fileTimers[0] = [currentFileId, elapsedTime.toString(), 1];
                        } else if (fileTimers[1] == "") {
                            //Subcase 2: one entry
                            fileTimers[1] = [currentFileId, elapsedTime.toString(), 1];
                        } else {
                            //Subcase 3: two entries and both not empty -> can just push normally
                            fileTimers.push([currentFileId, elapsedTime.toString(), 1]);
                        }
                    } else {
                        //"Normal" case -> can just push a new entry
                        fileTimers.push([currentFileId, elapsedTime.toString(), 1]);
                    }
                }
                //Log the time of the file being closed and for how long it was open
                logText += "File " + currentFileId + " closed at " + timeStamp + " after " + elapsedTime + " ms\n";
            }

            //Determine if the new URL belongs to a file (not the nicest way of doing it)
            //Split the URL into its components
            let splitUrl = url.split("/");
            //Check URL based on heuristics
            if (splitUrl[2] == "github.com" && splitUrl[5] == "pull" && splitUrl[7] == "commits" && splitUrl[8].length == 40) {
                //If it is a file URL, start a timer for the current file
                let fileId = splitUrl[8];
                currentFileTimer = [fileId, tempTime.toString()];
                //Log the time of the file being opened
                logText += "File " + fileId + " opened at " + getTimeStamp(new Date) + "\n";
            } else {
                //If not a file URL, reset the currentFileTimer parameter
                currentFileTimer = ["", ""];
            }

            //Dynamically end a session
            //Check URL based on heuristics
            if (!(splitUrl[2] == "github.com" && splitUrl[5] == "pull") && sessionstatus) {
                sessionstatus = false;
                sessionTabActive = false;
            }

            chrome.storage.sync.set({ fileTimers, sessionTabActive, logText, currentFileTimer, sessionstatus });
        }
    });
}
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
                chrome.storage.sync.get(["logText", "fileTimers", "currentFileTimer", "feedbackValue", "feedbackSubmitted"], ({ logText, fileTimers, currentFileTimer, feedbackValue, feedbackSubmitted }) => {
                    //Reset variables
                    let currentURL = location.href;
                    fileTimers = [[], []];
                    feedbackValue = "";
                    feedbackSubmitted = false;
                    currentFileTimer = ["", ""];
                    logText = "New logging session started at " + getTimeStamp(date) + "\nStarting URL:  " + currentURL + "\n";
                    chrome.storage.sync.set({ logText, currentURL, fileTimers, currentFileTimer, feedbackValue, feedbackSubmitted });
                });

                //Log the current tab
                chrome.storage.sync.get("currentTab", ({ currentTab }) => {
                    console.log(currentTab);
                });
            }
            //End
            if (oldItemValue == true && newItemValue == false) {
                chrome.storage.sync.get(["loggingStartTime", "logText", "fullLog", "fileTimers", "feedbackValue", "feedbackSubmitted"], ({ loggingStartTime, logText, fullLog, fileTimers, feedbackValue, feedbackSubmitted }) => {
                    timePassed = absoluteTime - loggingStartTime;
                    logText += "Ending URL:  " + location.href + "\nCurrent logging session ended at " + getTimeStamp(date) + " after " + timePassed + " ms\n";
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
                    } else {
                        logText += "\nNo feedback was given.\n";
                    }
                    fullLog += logText+ "\n----------\n";
                    chrome.storage.sync.set({ loggingStartTime, logText, fullLog });
                });
            }
        }

        //Log the new fucused tab when a tab change occurs
        if (item == "currentTab") {
            console.log("Checkpoint");
            if (changed[item].newValue != changed[item].oldValue) {
                console.log("Tab has changed!");
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
function handleIfSubmit(element) {
    if (element.innerHTML.substring(13, 26) == "Submit review") {
        chrome.storage.sync.get("feedbackSubmitted", ({ feedbackSubmitted }) => {
            feedbackSubmitted = true;
            chrome.storage.sync.set({ feedbackSubmitted });
        });
    }
}


//Listener for changes in the storage
chrome.storage.onChanged.addListener(storageChangedListener);


//Listener for tab/url changes
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === "urlchange") {
        chrome.storage.sync.get(["loggingstatus", "sessionstatus", "logText", "fileTimers", "currentFileTimer"], ({ loggingstatus, sessionstatus, logText, fileTimers, currentFileTimer }) => {
            //Dynamically start a session
            if (loggingstatus) {
                let splitUrl = request.url.split("/");
                //Check URL based on heuristics
                if ((splitUrl[2] == "github.com" && splitUrl[5] == "pull") && !sessionstatus) {
                    sessionstatus = true;
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
                }

                //Determine if the new URL belongs to a file (not the nicest way of doing it)
                //Split the URL into its components
                let splitUrl = request.url.split("/");
                //Check URL based on heuristics
                if (splitUrl[2] == "github.com" && splitUrl[5] == "pull" && splitUrl[7] == "commits" && splitUrl[8].length == 40) {
                    //If it is a file URL, start a timer for the current file
                    let fileId = splitUrl[8];
                    currentFileTimer = [fileId, tempTime.toString()];
                } else {
                    //If not a file URL, reset the currentFileTimer parameter
                    currentFileTimer = ["", ""];
                }

                //logText += timeStamp + /*(23 - timeStamp.length + 4) **/ '    '+ 'URL changed to ' + request.url + '\n';
                console.log(timeStamp + /*(23 - timeStamp.length + 4) **/ '    ' + 'URL changed to ' + request.url + '\n');

                //Dynamically end a session
                //Check URL based on heuristics
                if (!(splitUrl[2] == "github.com" && splitUrl[5] == "pull") && sessionstatus) {
                    sessionstatus = false;
                }

                chrome.storage.sync.set({ logText, fileTimers, currentFileTimer, sessionstatus });
            }
        });
    }
});
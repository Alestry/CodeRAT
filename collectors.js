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
        logText += timeStamp + /*(23 - timeStamp.length + 4) **/ '    ' + 'CLICK: ' + element.constructor.name + ' - ' + element.nodeName + ' - ' + element.innerHTML.substring(0, 150) + '\n';
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

        //Create a log message with a timestamp when a logging session is started/ended
        if (item == "loggingstatus") {
            oldItemValue = changed[item].oldValue;
            newItemValue = changed[item].newValue;

            //Log when a session starts/ends. The absolute time is needed in the storage to determine a logging session's length
            date = new Date();
            let absoluteTime = date.getTime();

            //Determine whether it is the start or the end of a logging session and log the appropriate message
            //Start
            if (oldItemValue == false && newItemValue == true) {
                loggingStartTime = absoluteTime;
                chrome.storage.sync.set({ loggingStartTime });
                chrome.storage.sync.get(["logText", "fileTimers", "currentFileTimer"], ({ logText, fileTimers, currentFileTimer }) => {
                    let currentURL = location.href;
                    fileTimers = [[],[]];
                    currentFileTimer = ["", ""];
                    logText = "New logging session started at " + getTimeStamp(date) + "\nStarting URL:  " + currentURL + "\n";
                    chrome.storage.sync.set({ logText, currentURL, fileTimers, currentFileTimer });
                });

                //Log the current tab
                chrome.storage.sync.get("currentTab", ({ currentTab }) => {
                    console.log(currentTab);
                });
            }
            //End
            if (oldItemValue == true && newItemValue == false) {
                chrome.storage.sync.get(["loggingStartTime", "logText", "loggingFinished", "fileTimers"], ({ loggingStartTime, logText, loggingFinished, fileTimers }) => {
                    timePassed = absoluteTime - loggingStartTime;
                    loggingFinished = true;
                    logText += "Ending URL:  " + location.href + "\nCurrent logging session ended at " + getTimeStamp(date) + " after " + timePassed + " ms\n";
                    logText += "\nTime spent on each file:\n";
                    //Janky things with fileTimers array, depending on its length (make it look nice)
                    if (fileTimers[0] == "") {
                        logText += "No files were opened in this logging session.\n";
                    } else if (fileTimers[1] == "") {
                        logText += fileTimers[0][0] + ": " + fileTimers[0][1] + " ms\n";
                    } else {
                        let i = 0;
                        for (i = 0; i < fileTimers.length; i++) {
                            logText += fileTimers[i][0] + ": " + fileTimers[i][1] + "ms\n";
                        }
                    }
                    chrome.storage.sync.set({ loggingStartTime, logText, loggingFinished });
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
    chrome.storage.sync.get("loggingstatus", ({ loggingstatus }) => {
        if (loggingstatus) {
            log(target);
        }
    });
}, false);


//Listener for changes in the storage
chrome.storage.onChanged.addListener(storageChangedListener);


//Listener for tab/url changes
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === "urlchange") {
        chrome.storage.sync.get(["loggingstatus", "logText", "fileTimers", "currentFileTimer"], ({ loggingstatus, logText, fileTimers, currentFileTimer }) => {
            if (loggingstatus) {
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
                        //If the current file already has an existing timer in the array, add the current elapsed time to it
                        fileTimers[currentFileIdIndex][1] = (Number(fileTimers[currentFileIdIndex][1]) + elapsedTime).toString();
                    } else {
                        //If the current file does not yet have an existing timer in the array, create one and assign the current elapsed time
                        //Due to the manner of creation of the fileTimers array, we need to do some janky things to have a clean array in the end
                        if (fileTimers.length < 3) {
                            //"Stupid" case -> need to overwrite existing empty array entries
                            if (fileTimers[0] == "") {
                                //Subcase 1: no entries yet
                                fileTimers[0] = [currentFileId, elapsedTime.toString()];
                            } else if (fileTimers[1] == "") {
                                //Subcase 2: one entry
                                fileTimers[1] = [currentFileId, elapsedTime.toString()];
                            } else {
                                //Subcase 3: two entries and both not empty -> can just push normally
                                fileTimers.push([currentFileId, elapsedTime.toString()]);
                            }
                        } else {
                            //"Normal" case -> can just push a new entry
                            fileTimers.push([currentFileId, elapsedTime.toString()]);
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

                logText += timeStamp + /*(23 - timeStamp.length + 4) **/ '    '+ 'URL changed to ' + request.url + '\n';
                console.log(timeStamp + /*(23 - timeStamp.length + 4) **/ '    ' + 'URL changed to ' + request.url + '\n');
                chrome.storage.sync.set({ logText, fileTimers, currentFileTimer });
            }
        });
    }
});
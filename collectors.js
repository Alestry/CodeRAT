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
    console.log(timeStamp);
    console.log(element);
}


//Handle changes in the storage
function storageChangedListener(changed) {
    //Make a list of all changed items
    changedStorageItems = Object.keys(changed);

    //Create a log message with a timestamp when a logging session is started/ended
    for (item of changedStorageItems) {
        if (item == "loggingstatus") {
            oldItemValue = changed[item].oldValue;
            newItemValue = changed[item].newValue;

            //Log when a session starts/ends. The absolute time is needed in the storage to determine a logging session's length
            date = new Date();
            absoluteTime = date.getTime();

            //Determine whether it is the start or the end of a logging session and log the appropriate message
            if (oldItemValue == false && newItemValue == true) {
                loggingStartTime = absoluteTime;
                chrome.storage.sync.set({ loggingStartTime });
                console.log("New logging session started at " + getTimeStamp(date));
            }
            if (oldItemValue == true && newItemValue == false) {
                loggingStartTime = chrome.storage.sync.get("loggingStartTime", ({ loggingStartTime }) => {
                    timePassed = absoluteTime - loggingStartTime;
                    console.log("Current logging session ended at " + getTimeStamp(date) + " after " + timePassed +  " ms");
                });
            }
            break;
        }
    }
}


//Get element clicked
document.addEventListener("click", function (e) {
    e = e || window.event;
    var target = e.target || e.srcElement;
    loggingstatus = chrome.storage.sync.get("loggingstatus", ({ loggingstatus }) => {
        if (loggingstatus) {
            log(target);
        }
    });
}, false);


//Listener for changes in the storage
chrome.storage.onChanged.addListener(storageChangedListener);
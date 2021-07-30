//Button functionality (toggle loggingstatus variable in the storage)
toggle_button.addEventListener("click", async () => {
    chrome.storage.sync.get("loggingstatus", ({ loggingstatus }) => {
        if (loggingstatus) {
            loggingstatus = false;
            toggle_button.style.backgroundColor = buttonColor = "lime";
            toggle_button.innerText = buttonInnerText = "Start Logging";
        } else {
            loggingstatus = true;
            toggle_button.style.backgroundColor = buttonColor = "red";
            toggle_button.innerText = buttonInnerText = "Stop Logging";
        }
        chrome.storage.sync.set({ loggingstatus, buttonColor, buttonInnerText });
    });
});


//Retain button formatting from storage
chrome.storage.sync.get("buttonColor", ({ buttonColor }) => {
    toggle_button.style.backgroundColor = buttonColor;
});
chrome.storage.sync.get("buttonInnerText", ({ buttonInnerText }) => {
    toggle_button.innerText = buttonInnerText;
});


//Handle changes in the storage
function storageChangedListener(changed) {
    //Make a list of all changed items
    changedStorageItems = Object.keys(changed);

    //Go through all of the items in the storage
    for (item of changedStorageItems) {

        //Look at the loggingFinished parameter
        if (item == "loggingFinished") {
            oldItemValue = changed[item].oldValue;
            newItemValue = changed[item].newValue;

            //If it indicates that a logging session has ended
            if (oldItemValue == false && newItemValue == true) {
                loggingFinished = false;
                chrome.storage.sync.set({ loggingFinished });
                chrome.storage.sync.get("logText", ({ logText }) => {
                    navigator.clipboard.writeText(logText).then(() => {
                        alert("Logging Session copied to Clipboard.");
                    });
                });
            }
        }
    }
}


//Listener for changes in the storage
chrome.storage.onChanged.addListener(storageChangedListener);
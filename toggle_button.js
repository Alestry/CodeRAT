//Button functionality (toggle loggingstatus variable in the storage)
toggle_button.addEventListener("click", async () => {
    loggingstatus = chrome.storage.sync.get("loggingstatus", ({ loggingstatus }) => {
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


//Retain button formatting form storage
buttonColor = chrome.storage.sync.get("buttonColor", ({ buttonColor }) => {
    toggle_button.style.backgroundColor = buttonColor;
});
buttonInnerText = chrome.storage.sync.get("buttonInnerText", ({ buttonInnerText }) => {
    toggle_button.innerText = buttonInnerText;
});
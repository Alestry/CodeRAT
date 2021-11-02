//Button functionality (toggle loggingstatus variable in the storage)
toggle_button.addEventListener("click", async () => {
    chrome.storage.sync.get("loggingstatus", ({ loggingstatus }) => {
        if (loggingstatus) {
            loggingstatus = false;
            toggle_button.style.backgroundColor = "lime";
            toggle_button.innerText = "Enable Logging";
        } else {
            loggingstatus = true;
            toggle_button.style.backgroundColor = "red";
            toggle_button.innerText = "Disable Logging";
        }
        chrome.storage.sync.set({ loggingstatus });
    });
});


//Apply formatting dynamically
chrome.storage.sync.get("loggingstatus", ({ loggingstatus }) => {
    if (loggingstatus) {
        toggle_button.style.backgroundColor = "red";
        toggle_button.innerText = "Disable Logging";
    } else {
        toggle_button.style.backgroundColor = "lime";
        toggle_button.innerText = "Enable Logging";
    }
});
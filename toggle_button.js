//Button functionality (toggle loggingstatus variable in the storage)
toggle_button.addEventListener("click", async () => {
    loggingstatus = chrome.storage.sync.get("loggingstatus", ({ loggingstatus }) => {
        if (loggingstatus) {
            loggingstatus = false;
        } else {
            loggingstatus = true;
        }
        chrome.storage.sync.set({ loggingstatus });
    });
});
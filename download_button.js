//Copy current fullLog to clipboard when clicked
download_button.addEventListener("click", async () => {
    chrome.storage.sync.get("fullLog", ({ fullLog }) => {
        navigator.clipboard.writeText(fullLog).then(() => {
            alert("Logging Session copied to Clipboard. The log has been reset.");
        });
        //Reset the log
        fullLog = "";
        chrome.storage.sync.set({fullLog});
    });
});
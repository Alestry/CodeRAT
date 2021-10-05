//Copy current logText to clipboard when clicked
download_button.addEventListener("click", async () => {
    chrome.storage.sync.get("fullLog", ({ fullLog }) => {
        navigator.clipboard.writeText(fullLog).then(() => {
            alert("Logging Session copied to Clipboard.");
        });
    });
});
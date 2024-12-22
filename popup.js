const toggle = document.getElementById("workerToggle");
const statusDiv = document.getElementById("status");

const message = "Auto-Pause Manager: ";

toggle.addEventListener("change", () => {
    const isEnabled = toggle.checked;
    chrome.storage.sync.set({ workerEnabled: isEnabled }, () => {
        console.log("workerEnabled set to:", isEnabled);
        statusDiv.textContent = isEnabled
            ? message + "ON"
            : message + "OFF";
    });
});

document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(["workerEnabled"], (res) => {
        const enabled = !!res.workerEnabled;
        toggle.checked = enabled;
        statusDiv.textContent = enabled
            ? message + "ON"
            : message + "OFF";
    });
});

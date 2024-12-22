let isSWEnabled = false;
let checkIntervalId = null;

let playingTabs = new Set();

function detectedNewMusicSource() {
    pauseFirstMusicYoutubeTab();
}

function closedAllMusicSources() {
    playFirstMusicYoutubeTab();
}

function pauseFirstMusicYoutubeTab() {
    chrome.tabs.query({ url: "*://music.youtube.com/*" }, (tabs) => {
        if (tabs && tabs.length > 0) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    const player = document.querySelector("video");
                    if (player && !player.paused) {
                        player.pause();
                    }
                },
            });
        }
    });
}

function playFirstMusicYoutubeTab() {
    chrome.tabs.query({ url: "*://music.youtube.com/*" }, (tabs) => {
        if (tabs && tabs.length > 0) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    const player = document.querySelector("video");
                    if (player && player.paused) {
                        player.play();
                    }
                },
            });
        }
    });
}

function startIntervalChecking() {
    if (!checkIntervalId) {
        checkIntervalId = setInterval(() => {
            chrome.tabs.query({}, (tabs) => {
                const currentlyPlaying = new Set();

                for (const t of tabs) {
                    if (t.audible && !t.url.includes("music.youtube.com")) {
                        currentlyPlaying.add(t.id);

                        if (!playingTabs.has(t.id)) {
                            detectedNewMusicSource();
                        }
                    }
                }

                if (playingTabs.size > 0 && currentlyPlaying.size === 0) {
                    closedAllMusicSources();
                }

                playingTabs = currentlyPlaying;
            });
        }, 1000);
    }
}

function stopIntervalChecking() {
    if (checkIntervalId) {
        clearInterval(checkIntervalId);
        checkIntervalId = null;
    }
    playingTabs.clear();
}

function enableServiceWorker() {
    if (!isSWEnabled) {
        isSWEnabled = true;
        startIntervalChecking();
    }
}

function disableServiceWorker() {
    if (isSWEnabled) {
        isSWEnabled = false;
        stopIntervalChecking();
    }
}

chrome.storage.sync.get(["workerEnabled"], (res) => {
    const enabled = !!res.workerEnabled;
    if (enabled) {
        enableServiceWorker();
    } else {
        disableServiceWorker();
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes.workerEnabled) {
        if (changes.workerEnabled.newValue === true) {
            enableServiceWorker();
        } else {
            disableServiceWorker();
        }
    }
});

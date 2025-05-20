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

const STORAGE_KEY = 'yt-manager-slider-width';
const MIN_WIDTH_KEY = 'yt-manager-slider-min-width';
const SLIDER_STYLE_KEY = 'yt-manager-slider-style';

document.addEventListener('DOMContentLoaded', initializePopup);

function initializePopup() {
    const slider = document.getElementById('width-slider');
    const label = document.getElementById('width-label');
    const minWidthInput = document.getElementById('min-width-input');
    const btnCircle = document.getElementById('slider-style-circle');
    const btnLine = document.getElementById('slider-style-line');
    loadSliderValue(slider, label);
    loadMinWidthValue(minWidthInput);
    loadSliderStyleButtons(btnCircle, btnLine, slider);
    slider.addEventListener('input', () => handleSliderInput(slider, label));
    minWidthInput.addEventListener('input', () => handleMinWidthInput(minWidthInput));
    btnCircle.addEventListener('click', () => handleSliderStyleButton('circle', slider, btnCircle, btnLine));
    btnLine.addEventListener('click', () => handleSliderStyleButton('line', slider, btnCircle, btnLine));
}

function loadSliderValue(slider, label) {
    chrome.storage.local.get([STORAGE_KEY], result => {
        const value = parseSliderValue(result[STORAGE_KEY]);
        slider.value = value;
        updateSliderUI(slider, label, value);
    });
}

function loadMinWidthValue(input) {
    chrome.storage.local.get([MIN_WIDTH_KEY], result => {
        const value = parseMinWidthValue(result[MIN_WIDTH_KEY]);
        input.value = value;
    });
}

function loadSliderStyleButtons(btnCircle, btnLine, slider) {
    chrome.storage.local.get([SLIDER_STYLE_KEY], result => {
        const value = result[SLIDER_STYLE_KEY] || 'circle';
        setSliderStyleButtonState(value, btnCircle, btnLine);
        updateSliderThumbStyle(slider, value);
        notifyYouTubeTabsSliderStyle(value);
    });
}

function handleSliderInput(slider, label) {
    const value = parseSliderValue(slider.value);
    chrome.storage.local.set({ [STORAGE_KEY]: value }, () => {
        updateSliderUI(slider, label, value);
        notifyYouTubeTabs(value);
    });
}

function handleMinWidthInput(input) {
    const value = parseMinWidthValue(input.value);
    chrome.storage.local.set({ [MIN_WIDTH_KEY]: value }, () => {
        notifyYouTubeTabsMinWidth(value);
    });
}

function handleSliderStyleButton(style, slider, btnCircle, btnLine) {
    chrome.storage.local.set({ [SLIDER_STYLE_KEY]: style }, () => {
        setSliderStyleButtonState(style, btnCircle, btnLine);
        updateSliderThumbStyle(slider, style);
        notifyYouTubeTabsSliderStyle(style);
    });
}

function setSliderStyleButtonState(style, btnCircle, btnLine) {
    btnCircle.classList.toggle('selected', style === 'circle');
    btnLine.classList.toggle('selected', style === 'line');
}

function updateSliderUI(slider, label, value) {
    slider.style.width = '100%';
    const percent = ((value - 10) / 90) * 100;
    slider.style.setProperty('--custom-slider-val', percent + '%');
    label.textContent = value + '%';
}

function updateSliderThumbStyle(slider, style) {
    slider.classList.remove('slider-thumb-circle', 'slider-thumb-line', 'slider-thumb-default');
    if (style === 'circle') slider.classList.add('slider-thumb-circle');
    else if (style === 'line') slider.classList.add('slider-thumb-line');
}

function notifyYouTubeTabs(value) {
    chrome.tabs.query({ url: '*://www.youtube.com/*' }, tabs => {
        tabs.forEach(tab => {
            try {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateSliderWidth',
                    widthPercent: value
                }, () => {
                    if (chrome.runtime.lastError) {
                        // Ignore tabs without the content script
                    }
                });
            } catch (e) {
                // Ignore errors
            }
        });
    });
}

function notifyYouTubeTabsMinWidth(value) {
    chrome.tabs.query({ url: '*://www.youtube.com/*' }, tabs => {
        tabs.forEach(tab => {
            try {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateSliderMinWidth',
                    minWidthPx: value
                }, () => {
                    if (chrome.runtime.lastError) {
                        // Ignore tabs without the content script
                    }
                });
            } catch (e) {
                // Ignore errors
            }
        });
    });
}

function notifyYouTubeTabsSliderStyle(style) {
    chrome.tabs.query({ url: '*://www.youtube.com/*' }, tabs => {
        tabs.forEach(tab => {
            try {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateSliderThumbStyle',
                    sliderStyle: style
                }, () => {
                    if (chrome.runtime.lastError) {
                        // Ignore tabs without the content script
                    }
                });
            } catch (e) {
                // Ignore errors
            }
        });
    });
}

function parseSliderValue(val) {
    const num = parseInt(val, 10);
    return (!isNaN(num) && num >= 0 && num <= 100) ? num : 100;
}

function parseMinWidthValue(val) {
    const num = parseInt(val, 10);
    return (!isNaN(num) && num >= 200 && num <= 500) ? num : 200;
}

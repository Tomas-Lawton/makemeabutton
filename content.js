console.log("Content script loaded");

let lastFocusedElement = null;

// Event listener to track the last focused input, textarea, or content-editable element
document.addEventListener('focus', (event) => {
    // Check if the focused element is an input, textarea, or contenteditable
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.isContentEditable) {
        lastFocusedElement = event.target;
    }
}, true); // Use capturing phase to ensure we catch focus events

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Message received:", request);
    if (request.action === "pasteValue") {
        // First, try to get the currently active input or textarea
        const activeElement = document.activeElement;

        // Check if the active element is a valid target
        let targetElement = null;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
            targetElement = activeElement;
        } else {
            // Fallback to last focused element if no active element is valid
            targetElement = lastFocusedElement;
        }

        if (targetElement) {
            // If the target element is contenteditable
            if (targetElement.isContentEditable) {
                // Create a new range and select it
                const range = document.createRange();
                const selection = window.getSelection();
                selection.removeAllRanges();
                range.selectNodeContents(targetElement);
                range.collapse(false); // Collapse to the end of the target element
                selection.addRange(range);

                // Insert the text at the current selection
                document.execCommand('insertText', false, request.value);
            } else {
                // For input or textarea
                targetElement.value = request.value;
                targetElement.dispatchEvent(new Event('input', { bubbles: true })); // Dispatch event to notify change
            }
        } else {
            console.error("No input, textarea, or contenteditable element was found.");
        }
    }
});

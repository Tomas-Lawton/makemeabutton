console.log("Content script loaded");

let lastFocusedElement = null;

// Event listener to track the last focused input, textarea, or content-editable element
document.addEventListener('focus', (event) => {
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        lastFocusedElement = target;
    }
}, true); // Use capturing phase to ensure we catch focus events

// Function to create and manage the note input field
function createNoteInputField(notes) {
    console.log('Active mode'); // Log to confirm the event was captured

    // Create and style the input field for note filtering
    const inputField = document.createElement('input');
    inputField.style.position = 'absolute';
    inputField.style.zIndex = '9999';

    // Position the input field at the last focused element
    if (lastFocusedElement) {
        const rect = lastFocusedElement.getBoundingClientRect();
        inputField.style.top = `${rect.bottom + window.scrollY}px`; // Position below the focused element
        inputField.style.left = `${rect.left + window.scrollX}px`; // Align with the focused element
    }

    document.body.appendChild(inputField);
    inputField.focus();

    // Handle input for filtering notes
    inputField.addEventListener('keyup', (inputEvent) => {
        const query = inputField.value.toLowerCase();
        const matchingNotes = Object.entries(notes)
            .filter(([_, note]) => note.noteName && note.noteName.toLowerCase().includes(query))
            .map(([_, note]) => note); // Get the note objects

        console.log("Matching Notes:", matchingNotes);
        // Here you can display the matching notes to the user
    });

    // Cleanup on blur
    inputField.addEventListener('blur', () => {
        document.body.removeChild(inputField);
    });

    // Handle selection on Enter key
    inputField.addEventListener('keydown', (inputEvent) => {
        if (inputEvent.key === 'Enter') {
            const selectedNote = Object.entries(notes).find(([_, note]) =>
                note.noteName && note.noteName.toLowerCase().includes(inputField.value.toLowerCase())
            );
            if (selectedNote) {
                const noteContent = selectedNote[1].noteText; // Get the note content
                console.log("Pasted Value:", noteContent); // Log the pasted value
                pasteValueToTarget(noteContent); // Paste value into the target input
            }
            inputField.blur(); // Remove input field after selection
        }
    });
}

// Function to paste value into the target element
function pasteValueToTarget(value) {
    const activeElement = document.activeElement;
    const targetElement = activeElement && (activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.isContentEditable) ? activeElement : lastFocusedElement;

    if (targetElement) {
        if (targetElement.isContentEditable) {
            const range = document.createRange();
            const selection = window.getSelection();
            selection.removeAllRanges();
            range.selectNodeContents(targetElement);
            range.collapse(false);
            selection.addRange(range);
            document.execCommand('insertText', false, value);
        } else {
            targetElement.value = value;
            targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        console.error("No input, textarea, or contenteditable element was found.");
    }
}

// Fetch notes from Chrome storage
chrome.storage.sync.get('notes', (data) => {
    const notes = data.notes || {}; // Keep notes as an object
    console.log("Fetched Notes:", notes);

    // Listen for keyup events to detect the '/' command
    document.addEventListener('keyup', (event) => {
        if (event.key === '/') {
            createNoteInputField(notes);
        }
    });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "pasteValue") {
        pasteValueToTarget(request.value); // Call the paste function with the value
    }
});

console.log("Content script loaded");

let lastFocusedElement = null;

document.addEventListener('focus', (event) => {
    const target = event.target;
    if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) && !target.hasAttribute("popup_input_box")) {
        lastFocusedElement = target;
        console.log('Set target:', lastFocusedElement);
    }
}, true);

function createNoteInputField(notes) {
    console.log('Active mode');
    const inputField = document.createElement('input');
    inputField.setAttribute("popup_input_box", "popup-input-box-1234");
    inputField.style.position = 'absolute';
    inputField.style.zIndex = '9999';

    if (lastFocusedElement) {
        const rect = lastFocusedElement.getBoundingClientRect();
        inputField.style.top = `${rect.bottom + window.scrollY}px`;
        inputField.style.left = `${rect.left + window.scrollX}px`;
    }

    document.body.appendChild(inputField);
    inputField.focus();

    inputField.addEventListener('keyup', () => {
        const query = inputField.value.toLowerCase();
        const matchingNotes = Object.entries(notes)
            .filter(([, note]) => note.noteName && note.noteName.toLowerCase().includes(query))
            .map(([, note]) => note);
        console.log("Matching Notes:", matchingNotes);
    });

    inputField.addEventListener('blur', () => {
        document.body.removeChild(inputField);
    });

    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const selectedNote = Object.entries(notes).find(([, note]) =>
                note.noteName && note.noteName.toLowerCase().includes(inputField.value.toLowerCase())
            );
            if (selectedNote) {
                const noteContent = selectedNote[1].noteText;
                console.log("Pasted Value:", noteContent);
                pasteValueToTarget(noteContent, true);
            }
            inputField.blur();
        } else if (event.key === 'Escape' || (event.key === 'Backspace' && inputField.value === '')) {
            inputField.blur();
        }
    });
}

function pasteValueToTarget(value, fromKeyUp = false) {
    const targetElement = lastFocusedElement;
    console.log(targetElement);
    
    if (!targetElement) {
        console.error("No input, textarea, or contenteditable element was found.");
        return;
    }

    if (targetElement.isContentEditable) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        if (fromKeyUp) {
            range.deleteContents(); // Delete last character if triggered by keyup
        }

        const textNode = document.createTextNode(value);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        console.log(`Inserted "${value}" into content editable element.`);
    } else {
        if (fromKeyUp) {
            targetElement.value = targetElement.value.slice(0, -1) + value; // Remove last character
        } else {
            targetElement.value += value; // Just append the value
        }
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`Inserted "${value}" into input/textarea element.`);
    }
}

chrome.storage.sync.get('notes', (data) => {
    const notes = data.notes || {};
    console.log("Fetched Notes:", notes);
    
    document.addEventListener('keyup', (event) => {
        if (event.key === '/') {
            createNoteInputField(notes);
        }
    });
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "pasteValue") {
        pasteValueToTarget(request.value);
    }
});

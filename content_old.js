console.log("Content script loaded");

let lastFocusedElement = null;

// Load Google Fonts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Exo+2:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Lexend+Mega:wght@100..900&family=Reenie+Beanie&family=Sixtyfour+Convergence&display=swap";
document.head.appendChild(link);

// Track focused element
document.addEventListener("focus", (event) => {
    const target = event.target;
    if ((target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) && !target.hasAttribute("popup_input_box")) {
        lastFocusedElement = target;
        console.log("Set target:", lastFocusedElement);
    }
}, true);

function useExistingInputField(notes) {
    console.log("Active mode");

    if (!lastFocusedElement) {
        console.warn("No input, textarea, or contenteditable element is currently focused.");
        return;
    }

    // Create and style popup container
    const popupContainer = document.createElement("div");
    popupContainer.id = "notes-container";
    Object.assign(popupContainer.style, {
        fontFamily: "'Lexend Mega', sans-serif",
        fontWeight: "400",  // Default font weight for body text
        position: "absolute",
        zIndex: "9999",
        listStyleType: "none",
        top: `${lastFocusedElement.getBoundingClientRect().bottom + window.scrollY + 5}px`,
        left: `${lastFocusedElement.getBoundingClientRect().left + window.scrollX}px`,
        width: `${lastFocusedElement.getBoundingClientRect().width}px`,
        maxWidth: "400px",
        backgroundColor: "#00bf9f",
        maxHeight: "400px",
        display: "none",
        flexDirection: "column",
        borderRadius: "1rem",
        padding: "1rem",
        border: "4px solid #05060f",
        boxShadow: "0.4rem 0.4rem #05060f",
        overflow: "scroll"
    });

    // Title with bold font
    const title = document.createElement("h2");
    title.textContent = "Notes";
    title.style.fontWeight = "700";
    title.style.marginBottom = "1rem";
    popupContainer.appendChild(title);

    // Container for matching notes
    const notesContainer = document.createElement("ul");
    Object.assign(notesContainer.style, {
        flex: "1",
        flexDirection: "column",
        gap: "1rem",
        overflow: "hidden"
    });
    popupContainer.appendChild(notesContainer);

    document.body.appendChild(popupContainer);

    function showMatchingNotes() {
        const query = lastFocusedElement.value.toLowerCase().substring(1);
        const matchingNotes = Object.entries(notes)
            .filter(([_, note]) => {
                const defaultName = `Note ${note.noteIndex + 1}`;
                return (note.noteName && note.noteName.toLowerCase().includes(query)) || defaultName.toLowerCase().includes(query);
            })
            .map(([, note]) => note);

        notesContainer.innerHTML = ""; // Clear previous notes

        const notesToShow = matchingNotes.length ? matchingNotes : Object.values(notes).slice(0, 5);
        notesToShow.forEach(note => {
            const li = document.createElement("li");
            li.textContent = note.noteName || `Note ${note.noteIndex + 1}`;
            Object.assign(li.style, {
                cursor: "pointer",
                padding: ".5rem",
                fontSize: "1rem",
                borderRadius: ".5rem",
                fontWeight: "400"
            });
            li.addEventListener("mouseenter", () => li.style.backgroundColor = "#008f7f");
            li.addEventListener("mouseleave", () => li.style.backgroundColor = "");
            li.addEventListener("click", () => {
                if (note.noteText) pasteValueToTarget(note.noteText, true);
                popupContainer.style.display = "none";
                document.body.removeChild(popupContainer);
            });
            notesContainer.appendChild(li);
        });

        popupContainer.style.display = notesToShow.length ? "block" : "none";
    }

    showMatchingNotes(); 
    lastFocusedElement.addEventListener("input", showMatchingNotes);

    lastFocusedElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const selectedNote = Object.entries(notes).find(([, note]) => note.noteName && note.noteName.toLowerCase().includes(lastFocusedElement.value.toLowerCase()));
            if (selectedNote) pasteValueToTarget(selectedNote[1].noteText, true);
            popupContainer.style.display = "none";
            document.body.removeChild(popupContainer);
        } else if (["Escape", "Backspace"].includes(event.key) && lastFocusedElement.value === "") {
            popupContainer.style.display = "none";
            document.body.removeChild(popupContainer);
        }
    });
}

function pasteValueToTarget(value, fromKeyUp = false) {
    const target = lastFocusedElement;
    if (!target) return;

    if (target.isContentEditable) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        if (fromKeyUp) range.deleteContents();
        const textNode = document.createTextNode(value);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        target.value = fromKeyUp ? target.value.slice(0, -1) + value : target.value + value;
        target.dispatchEvent(new Event("input", { bubbles: true }));
    }
}

chrome.storage.sync.get("notes", (data) => {
    const notes = data.notes || {};
    document.addEventListener("keyup", (event) => {
        if (event.key === "/") useExistingInputField(notes);
    });
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "pasteValue") pasteValueToTarget(request.value);
});

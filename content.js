console.log("Content script loaded");

let lastFocusedElement = null;
let popupContainer = null;
let selectedIndex = -1; // Track the selected index for arrow key navigation
let listenersAdded = false; // Flag to ensure listeners are added only once

// Load Google Fonts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href =
  "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Exo+2:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Lexend+Mega:wght@100..900&family=Reenie+Beanie&family=Sixtyfour+Convergence&display=swap";
document.head.appendChild(link);

// Track the last focused input element
document.addEventListener(
  "focus",
  (event) => {
    const target = event.target;
    if (
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable) &&
      !target.hasAttribute("popup_input_box")
    ) {
      lastFocusedElement = target;
      console.log("Set target:", lastFocusedElement);
    }
  },
  true
);

// Paste value into the focused element
function pasteValueToTarget(value) {
  const target = lastFocusedElement;
  if (!target) return;

  // Remove "/" and text after it
  const slashIndex = target.value.indexOf("/");
  if (slashIndex !== -1) {
    target.value = target.value.slice(0, slashIndex);
  }

  // Insert the selected note text
  target.value += value;
  target.dispatchEvent(new Event("input", { bubbles: true }));
}

chrome.storage.sync.get(["notes", "slashCommandsEnabled"], (data) => {
  const notes = data.notes || {};
  if (data.slashCommandsEnabled) {
    document.addEventListener("keyup", (event) => {
      if (event.key === "/") useExistingInputField(notes);
    });
  }
});

// Listen for messages from the extension (e.g., paste requests)
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "pasteValue") {
    pasteValueToTarget(request.value);
  }
});

function useExistingInputField(notes) {
  console.log("Active mode");

  if (!lastFocusedElement) {
    console.warn(
      "No input, textarea, or contenteditable element is currently focused."
    );
    return;
  }

  // Remove the existing popup container if present
  if (popupContainer) {
    popupContainer.remove();
  }

  // Create new popup container
  popupContainer = document.createElement("div");

  popupContainer.id = "notes-container";
  Object.assign(popupContainer.style, {
    fontFamily: "'Lexend Mega', sans-serif",
    fontWeight: "400",
    position: "absolute",
    zIndex: "9999",
    listStyleType: "none",
    top: `${
      lastFocusedElement.getBoundingClientRect().bottom + window.scrollY + 5
    }px`,
    left: `${
      lastFocusedElement.getBoundingClientRect().left + window.scrollX
    }px`,
    width: `${lastFocusedElement.getBoundingClientRect().width}px`,
    maxWidth: "300px",
    backgroundColor: "rgb(5 222 186)",
    maxHeight: "400px",
    display: "none",
    flexDirection: "column",
    borderRadius: "1rem",
    padding: "1rem",
    border: "4px solid #05060f",
    boxShadow: "0.4rem 0.4rem #05060f",
    overflow: "scroll",
  });

  const title = document.createElement("h2");
  title.textContent = "Notes";
  title.style.fontWeight = "700";
  title.style.marginBottom = "1rem";
  popupContainer.appendChild(title);

  const notesContainer = document.createElement("ul");
  Object.assign(notesContainer.style, {
    flex: "1",
    flexDirection: "column",
    gap: "1rem",
    listStyleType: "none",
    padding: 0,
  });
  popupContainer.appendChild(notesContainer);

  document.body.appendChild(popupContainer);

  // Ensure event listeners are added only once
  if (!listenersAdded) {
    lastFocusedElement.addEventListener("input", showMatchingNotes);
    lastFocusedElement.addEventListener("keydown", handleKeydown);
    listenersAdded = true;
  }

  function showMatchingNotes() {
    const query = lastFocusedElement.value.toLowerCase().substring(1);
    const matchingNotes = Object.entries(notes)
      .filter(([_, note]) => {
        const defaultName = `Note ${note.noteIndex + 1}`;
        return (
          (note.noteName && note.noteName.toLowerCase().includes(query)) ||
          defaultName.toLowerCase().includes(query)
        );
      })
      .map(([, note]) => note);

    notesContainer.innerHTML = "";

    const notesToShow = matchingNotes.length
      ? matchingNotes
      : Object.values(notes).slice(0, 5);

    notesToShow.forEach((note, index) => {
      const li = document.createElement("li");
      li.textContent = note.noteName || `Note ${note.noteIndex + 1}`;
      Object.assign(li.style, {
        cursor: "pointer",
        padding: ".5rem",
        fontSize: "1rem",
        borderRadius: ".5rem",
        fontWeight: "400",
        transition: ".3s ease",
      });
      li.addEventListener("mouseenter", () => highlightNote(index));
      li.addEventListener("mouseleave", () => removeHighlight(index));
      li.addEventListener("click", () => {
        pasteValueToTarget(note.noteText);
        hidePopup();
      });
      notesContainer.appendChild(li);
    });

    if (popupContainer) {
      popupContainer.style.display = notesToShow.length ? "block" : "none";
    }
    selectedIndex = -1; // Reset selected index
  }

  function removeHighlight(index) {
    const items = notesContainer.querySelectorAll("li");
    items[index].style.backgroundColor = "";
    items[index].style.transform = "";
  }

  function highlightNote(index) {
    const items = notesContainer.querySelectorAll("li");
    if (selectedIndex >= 0) {
      items[selectedIndex].style.backgroundColor = ""; // Reset previous item style
    }
    selectedIndex = index;
    items[selectedIndex].style.backgroundColor = "rgb(6 211 177)"; // Highlight selected item
    items[selectedIndex].scrollIntoView({ block: "nearest" });
  }

  function hidePopup() {
    popupContainer.style.display = "none";
    selectedIndex = -1;
    if (popupContainer.parentNode) {
      popupContainer.parentNode.removeChild(popupContainer);
    }
  }

  function handleKeydown(event) {
    const items = notesContainer.querySelectorAll("li");

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (selectedIndex < items.length - 1) {
        highlightNote(selectedIndex + 1);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (selectedIndex > 0) {
        highlightNote(selectedIndex - 1);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      const currentValue = lastFocusedElement.value;
      const query = currentValue
        .slice(currentValue.indexOf("/") + 1)
        .toLowerCase();
      const selectedNote =
        Object.values(notes).find((note) => {
          const noteIndex = `note${note.noteIndex + 1}`;
          const noteName = note.noteName && note.noteName.toLowerCase();
          return noteName === query || noteIndex === query;
        }) ||
        (selectedIndex >= 0
          ? Object.values(notes)[selectedIndex]
          : Object.values(notes)[0]);

      if (selectedNote) {
        lastFocusedElement.value = currentValue.slice(
          0,
          currentValue.indexOf("/")
        );
        pasteValueToTarget(selectedNote.noteText);
        hidePopup();
      }
    } else if (
      event.key === "Escape" ||
      (event.key === "Backspace" && lastFocusedElement.value === "/")
    ) {
      hidePopup();
    }
  }

  showMatchingNotes();
}

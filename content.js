console.log("Content script loaded");

let lastFocusedElement = null;
let popupContainer = null;
let selectedIndex = -1; // Track the selected index for arrow key navigation

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
      target.isContentEditable ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "INPUT"
    ) {
      lastFocusedElement = target;
      console.log("Set target:", lastFocusedElement);
    } else {
      // If the focused element is a container (e.g., a div), drill down to find a child text node
      const textElement = findTextElement(target);
      if (textElement) {
        lastFocusedElement = textElement;
        console.log("Set target to text element:", lastFocusedElement);
      }
    }
  },
  true
);

// document.addEventListener("focus", (event) => {
//   const target = event.target;
//   if (target.isContentEditable || target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
//     lastFocusedElement = target;
//     console.log("Set focus target:", lastFocusedElement);
//   }
// }, true);

// document.addEventListener("input", (event) => {
//   const target = event.target;
//   if (target.isContentEditable) {
//     lastFocusedElement = target;
//     console.log("Set input target:", lastFocusedElement);
//   }
// });

// Recursive function to find the lowest-level child that contains text input
function findTextElement(element) {
  if (element.nodeType === Node.TEXT_NODE || element.isContentEditable) {
    return element;
  }

  for (const child of element.children) {
    const result = findTextElement(child);
    if (result) return result;
  }

  return null;
}

// Paste value into the focused element
function pasteValueToTarget(value) {
  const target = lastFocusedElement;
  if (!target) return;

  let targetContent = target.value || target.textContent;

  const slashIndex = targetContent.indexOf("/");
  if (slashIndex !== -1) {
    // Update the value or textContent depending on which is available
    if (target.value !== undefined) {
      target.value = targetContent.slice(0, slashIndex);
    } else {
      target.textContent = targetContent.slice(0, slashIndex);
    }
  }

  // Append the new value to the target
  if (target.value !== undefined) {
    target.value += value;
  } else {
    target.textContent += value;
  }

  // Dispatch input event to notify changes
  target.dispatchEvent(new Event("input", { bubbles: true }));
}

chrome.storage.sync.get(["notes", "slashCommandsEnabled"], (data) => {
  const notes = data.notes || {};
  if (data.slashCommandsEnabled) {
    document.addEventListener("keyup", (event) => {
      console.log("Creating popup");
      if (event.key === "/") useExistingInputField(notes);
    });
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "pasteValue") {
    pasteValueToTarget(request.value);
  }
});

function useExistingInputField(notes) {
  if (!lastFocusedElement) {
    console.warn(
      "No input, textarea, or contenteditable element is currently focused."
    );
    return;
  }

  selectedIndex = -1;
  popupContainer = document.createElement("div");

  lastFocusedElement.addEventListener("input", showMatchingNotes);
  lastFocusedElement.addEventListener("keydown", handleKeydown);

  popupContainer.id = "notes-container";
  Object.assign(popupContainer.style, {
    fontFamily: "'Lexend Mega', sans-serif",
    fontWeight: "400",
    position: "absolute",
    zIndex: "9999",
    listStyleType: "none",
    top: `${
      lastFocusedElement.getBoundingClientRect().bottom + window.scrollY + 2
    }px`,
    left: `${
      lastFocusedElement.getBoundingClientRect().left + window.scrollX
    }px`,
    // width: `${lastFocusedElement.getBoundingClientRect().width}px`,
    // maxWidth: "300px",
    width: '250px',
    // backgroundColor: "rgb(5 222 186)",
    backgroundColor: "rgb(254, 254, 239)",
    maxHeight: "400px",
    // display: "none",
    flexDirection: "column",
    borderRadius: ".5rem",
    padding: "6px",
    border: "3px solid #05060f",
    // boxShadow: "0.2rem 0.2rem #05060f",
    overflow: "scroll",
    color: "black"
  });

  const title = document.createElement("h2");
  title.textContent = "Notes";
  title.style.fontWeight = "700";
  title.style.marginBottom = "0";
  title.style.fontSize = "small";
  popupContainer.appendChild(title);

  const notesContainer = document.createElement("ul");
  Object.assign(notesContainer.style, {
    display: "flex",
    flexDirection: "column",
    gap: ".25rem",
    listStyleType: "none",
    padding: "4px",
    background: "rgb(240 233 202)",
    borderRadius: "6px",
    margin: "4px 0",
  });
  popupContainer.appendChild(notesContainer);

  document.body.appendChild(popupContainer);

  function showMatchingNotes() {
    // const query = lastFocusedElement.value.toLowerCase().substring(1);
    console.log(lastFocusedElement);
    // const query = lastFocusedElement.value
    //   .toLowerCase()
    //   .substring(lastFocusedElement.value.lastIndexOf("/") + 1);

    let query = "";
    if (lastFocusedElement) {
      if (lastFocusedElement.value) {
        query = lastFocusedElement.value
          .toLowerCase()
          .substring(lastFocusedElement.value.lastIndexOf("/") + 1);
      } else if (lastFocusedElement.textContent) {
        query = lastFocusedElement.textContent
          .toLowerCase()
          .substring(lastFocusedElement.textContent.lastIndexOf("/") + 1);
      } else {
        console.error("lastFocusedElement is undefined or not valid");
      }
    } else {
      console.error("lastFocusedElement is undefined or not valid");
    }

    console.log(query);
    const matchingNotes = Object.entries(notes)
      .filter(([_, note]) => {
        const queryStr = String(query).toLowerCase();
        const noteNameQuery =
          note.noteName !== null
            ? String(note.noteName).toLowerCase()
            : `Note ${note.noteIndex + 1}`.toLowerCase();

        return noteNameQuery.includes(queryStr);
      })
      .map(([, note]) => note);
    console.log(matchingNotes);
    notesContainer.innerHTML = ""; // Clear

    // Show matching notes or a placeholder message if no results
    let notesToShow = matchingNotes.length ? matchingNotes : [];
    if (notesToShow.length === 0) {
      notesContainer.innerHTML = "";
      console.log("none");
      const noResults = document.createElement("li");
      noResults.textContent = "No matching notes";
      Object.assign(noResults.style, {
        cursor: "pointer",
        padding: "3px",
        fontSize: "1rem",
        borderRadius: "4px",
        fontWeight: "400",
        transition: ".3s ease",
        padding: ".1rem .2rem"
      });
      notesContainer.appendChild(noResults);
    } else {
      notesToShow.forEach((note, index) => {
        const li = document.createElement("li");
        li.textContent = note.noteName || `Note ${note.noteIndex + 1}`;
        Object.assign(li.style, {
          cursor: "pointer",
          padding: "3px",
          fontSize: "1rem",
          borderRadius: "4px",
          fontWeight: "400",
          transition: ".3s ease",
          padding: ".1rem .2rem"
        });
        li.addEventListener("mouseenter", () => highlightNote(index));
        li.addEventListener("mouseleave", () => removeHighlight(index));
        li.addEventListener("click", () => {
          pasteValueToTarget(note.noteText);
          hidePopup();
        });
        notesContainer.appendChild(li);
      });
    }
    selectedIndex = -1; // Reset selected index on every popup load

    const popupHeight = popupContainer.offsetHeight;
    const containerHeight = window.innerHeight - popupContainer.getBoundingClientRect().top;

    if (popupHeight > containerHeight) {
      popupContainer.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
    }
  }

  function hidePopup() {
    if (popupContainer) {
      lastFocusedElement.removeEventListener("input", showMatchingNotes);
      lastFocusedElement.removeEventListener("keydown", handleKeydown);
      popupContainer.remove();
    }
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
    items[selectedIndex].style.backgroundColor = "rgb(212 205 177)"; // Highlight selected item
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
      // const currentValue = lastFocusedElement.value;
      // const query = currentValue
      //   .slice(currentValue.indexOf("/") + 1)
      //   .toLowerCase();

      const currentValue = lastFocusedElement
        ? lastFocusedElement.value || lastFocusedElement.textContent
        : "";
      let query = "";

      if (currentValue) {
        query = currentValue.slice(currentValue.indexOf("/") + 1).toLowerCase();
      } else {
        console.log("not found");
      }

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
    }
    // else if (
    //   event.key === "Escape" ||
    //   (event.key === "Backspace" && lastFocusedElement.value.endsWith("/"))
    // ) {
    //   hidePopup();
    // }
    else if (
      event.key === "Escape" ||
      (event.key === "Backspace" &&
        (lastFocusedElement.value || lastFocusedElement.textContent).endsWith(
          "/"
        ))
    ) {
      hidePopup();
    }
  }

  showMatchingNotes();
}

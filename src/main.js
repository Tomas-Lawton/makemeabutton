import { updateDragDropListeners } from "./drag.js";
import { playPop } from "./sounds.js";

const input = document.getElementById("note-input");
const pasteButton = document.getElementById("instant-paste");
const noteMessage = document.getElementById("note-message");
const notes = document.getElementById("notes");

let noteCounter = 0;

function deleteLocalNote(index) {
  chrome.storage.sync.get("notes", (data) => {
    const savedNotes = data.notes || {};

    console.log("deleted, ", index);
    delete savedNotes[index];
    checkNoteMessage(savedNotes);
    updateDragDropListeners();

    chrome.storage.sync.set({ notes: savedNotes }, () => {
      console.log("Notes saved:", savedNotes);
    });

    const audio = new Audio("./public/audio/swish.mp3");
    audio.play();
  });
}

function checkNoteMessage(savedNotes) {
  // console.log(savedNotes)
  if (Object.keys(savedNotes).length > 0) {
    noteMessage.style.display = "none";
  } else {
    noteMessage.style.display = "";
  }
}

function saveLocalNote(noteData) {
  chrome.storage.sync.get("notes", (data) => {
    const savedNotes = data.notes || {};

    const key = noteCounter.toString();
    // console.log("Saving note ", key);
    savedNotes[key] = noteData; // set key (index) to current count
    chrome.storage.sync.set({ notes: savedNotes }, () => {
      console.log("Notes saved:", savedNotes);
    });
    checkNoteMessage(savedNotes);

    noteCounter++; // increment the count
    chrome.storage.sync.set({ noteCounter: noteCounter }, () => {
      console.log("Set counter:", noteCounter);
    });
  });
}

function loadNotes() {
  chrome.storage.sync.get("notes", (data) => {
    const savedNotes = data.notes || {};

    chrome.storage.sync.get(
      "noteCounter",
      (data) => (noteCounter = data.noteCounter)
    );
    console.log(savedNotes);

    checkNoteMessage(savedNotes);

    const sortedNotes = Object.entries(savedNotes).sort(
      ([, a], [, b]) => a.displayIndex - b.displayIndex
    );

    sortedNotes.forEach(([_, data], index) => {
      data.displayIndex = index;
      createNote(data);
    });

    console.log("Before sorting:", savedNotes);
    console.log("After sorting:", sortedNotes);

    updateDragDropListeners();
  });
}

function getDate() {
  const currentDate = new Date();
  const date = `${(currentDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${currentDate
    .getDate()
    .toString()
    .padStart(2, "0")}/${currentDate.getFullYear()}`;
  const time = `${currentDate
    .getHours()
    .toString()
    .padStart(2, "0")}:${currentDate.getMinutes().toString().padStart(2, "0")}`;
  return `${time}, ${date}`; // Combine date and time
}

function makeNote(noteText) {
  const date = getDate();
  const data = { noteText, date, noteIndex: noteCounter };
  createNote(data);
  saveLocalNote(data);
  playPop();
  updateDragDropListeners();
}

pasteButton.addEventListener("click", async () => {
  try {
    const noteText = await navigator.clipboard.readText(); // Read text from the clipboard
    makeNote(noteText); // Create the note with the pasted text
    input.value = ""; // Clear input after use
  } catch (err) {
    console.error("Failed to read clipboard contents: ", err);
  }
});

input.addEventListener("paste", (event) => {
  const noteText = (event.clipboardData || window.clipboardData).getData(
    "text"
  );
  event.preventDefault();
  makeNote(noteText);
  input.value = "";
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && input.value.trim() !== "") {
    makeNote(input.value.trim());
    input.value = "";
  }
});

function createNote({ noteText, date, noteIndex, displayIndex, noteName }) {
  console.log("Creating note: ", noteText, date, noteIndex);

  // NOTE CONTENT
  const noteContent = document.createElement("div");
  noteContent.classList.add("note-content");

  const note = document.createElement("div");
  note.classList.add("draggable");
  note.classList.add("note");
  note.setAttribute("draggable", true);
  note.setAttribute("display-index", displayIndex);
  note.setAttribute("key", noteIndex);

  // HEADER START
  const noteHeader = document.createElement("div");
  noteHeader.classList.add("note-header");

  let noteHeading = document.createElement("h3");
  noteHeading.textContent = noteName || `🗒️ Note ${noteIndex + 1}`; // Display note index + 1 for user-friendly numbering
  noteHeading.classList.add("note-title");

  const editBtn = document.createElement("div");
  editBtn.classList.add("edit");
  const editIcon = document.createElement("img");
  editIcon.src = "./public/uicons/uicons-round-medium-outline-pencil.svg";
  editBtn.appendChild(editIcon);

  const discardBtn = document.createElement("div");
  discardBtn.classList.add("discard");
  const discardIcon = document.createElement("img");
  discardIcon.src = "./public/uicons/uicons-round-medium-outline-close.svg";
  discardBtn.appendChild(discardIcon);

  const acceptBtn = document.createElement("div");
  acceptBtn.classList.add("accept");
  const acceptIcon = document.createElement("img");
  acceptIcon.src = "./public/uicons/uicons-round-medium-outline-checkmark.svg";
  acceptBtn.appendChild(acceptIcon);

  // HEADER DONE
  const dateElem = document.createElement("p");
  dateElem.textContent = date;
  dateElem.classList.add("note-date");

  let noteTextDiv = document.createElement("div");
  noteTextDiv.textContent = noteText;
  noteTextDiv.classList.add("note-text");

  //   NOTE ACTIONS
  const actionContainer = document.createElement("div");

  const copyBtn = document.createElement("button");
  copyBtn.classList.add("copy-btn");
  const copyIcon = document.createElement("img"); // Use a div instead of an <i>
  copyIcon.src = "./public/uicons/uicons-round-medium-outline-copy.svg";

  copyBtn.appendChild(copyIcon);
  copyBtn.appendChild(document.createTextNode("Copy"));

  const deleteIcon = document.createElement("img");
  deleteIcon.src = "./public/uicons/uicons-round-medium-outline-trash.svg";
  // deleteIcon.src = "./public/uicons/uicons-round-medium-outline-archivebox.svg";
  const deleteBtn = document.createElement("div");
  deleteBtn.appendChild(deleteIcon);
  deleteBtn.classList.add("delete-btn");
  // deleteBtn.textContent = "Delete";

  actionContainer.classList.add("note-actions");

  // EDITING LISTEWNERS. TO DO ADD SAVING TO THE STATE AGAIN ALSO FOR REAARAGNING
  let originalTitle = noteHeading.textContent;
  let originalText = noteTextDiv.textContent;

  editBtn.addEventListener("click", () => {
    editBtn.style.display = "none";
    // deleteBtn.style.display = "none";
    acceptBtn.style.display = "flex";
    discardBtn.style.display = "flex";

    const input1 = document.createElement("input");
    input1.type = "text";
    input1.value = noteHeading.textContent;
    input1.classList.add("note-title");
    noteHeading.replaceWith(input1);

    const input2 = document.createElement("textarea");
    input2.name = "post";
    input2.maxLength = "5000";

    input2.value = noteTextDiv.textContent;
    input2.classList.add("note-text");
    noteTextDiv.replaceWith(input2);

    actionContainer.classList.add("note-background");

    note.draggable = false;

    const autoResize = () => (input2.style.height = `${input2.scrollHeight}px`); // Set height based on scrollHeight
    input2.addEventListener("input", autoResize);
    autoResize(); // Initial resize

    noteHeading = input1;
    noteTextDiv = input2;
  });

  acceptBtn.addEventListener("click", () => {
    originalTitle = noteHeading.value;
    originalText = noteTextDiv.value;

    const newHeading = document.createElement("h3");
    newHeading.textContent = originalTitle;
    newHeading.classList.add("note-title");

    const newTextDiv = document.createElement("div");
    newTextDiv.textContent = originalText;
    newTextDiv.classList.add("note-text");

    noteHeading.replaceWith(newHeading);
    noteTextDiv.replaceWith(newTextDiv);
    noteHeading = newHeading;
    noteTextDiv = newTextDiv;

    // Update local storage with the new note data
    chrome.storage.sync.get("notes", (data) => {
      const savedNotes = data.notes || {};
      const newDate = getDate();
      dateElem.textContent = newDate;
      savedNotes[noteIndex] = {
        noteText: originalText,
        date: newDate,
        noteIndex,
        displayIndex,
        noteName: originalTitle,
      };

      chrome.storage.sync.set({ notes: savedNotes }, () => {
        console.log("Notes saved:", savedNotes);
      });
    });

    actionContainer.classList.remove("note-background");
    note.draggable = true;

    editBtn.style.display = "flex";
    acceptBtn.style.display = "none";
    discardBtn.style.display = "none";
  });

  discardBtn.addEventListener("click", () => {
    const newHeading = document.createElement("h3");
    newHeading.textContent = originalTitle;
    newHeading.classList.add("note-title");

    const newTextDiv = document.createElement("div");
    newTextDiv.textContent = originalText;
    // console.log(originalText)
    newTextDiv.classList.add("note-text");

    noteHeading.replaceWith(newHeading);
    noteTextDiv.replaceWith(newTextDiv);

    noteHeading = newHeading;
    noteTextDiv = newTextDiv;

    actionContainer.classList.remove("note-background");
    note.draggable = true;

    editBtn.style.display = "flex";
    // deleteBtn.style.display = "flex";
    acceptBtn.style.display = "none";
    discardBtn.style.display = "none";
  });

  deleteBtn.addEventListener("click", () => {
    // console.log("deleting note: ", noteIndex);
    note.remove();
    deleteLocalNote(noteIndex); // Remove note using index
  });

  copyBtn.addEventListener("click", () => {
    navigator.clipboard
      .writeText(originalText)
      .then(() => {
        const allNotes = notes.querySelectorAll(".copy-btn");
        allNotes.forEach((singleNote) => {
          singleNote.childNodes[1].textContent = "Copy";
        });
        copyBtn.childNodes[1].textContent = "Copied";
      })
      .catch((err) => console.error("Failed to copy text: ", err));
  });

  //

  noteHeader.appendChild(noteHeading);
  noteHeader.appendChild(editBtn);
  noteHeader.appendChild(acceptBtn);
  noteHeader.appendChild(discardBtn);
  noteHeader.appendChild(deleteBtn);

  actionContainer.appendChild(copyBtn);
  actionContainer.appendChild(dateElem);

  noteContent.appendChild(noteHeader);
  noteContent.appendChild(noteTextDiv);

  note.appendChild(noteContent);
  note.appendChild(actionContainer);

  notes.prepend(note); // display in reverse order
}

function loadShapePositions() {
  const shapes = document.querySelectorAll(".background-svg");
  shapes.forEach((shape) => {
    // Ensure shape width and height stay within a reasonable size
    let width = Math.floor(Math.random() * 150) + 150; // Between 150 and 300
    shape.style.width = `${width}px`;
    shape.style.height = `${width}px`; // Make height equal to width for square shapes
    shape.style.display = "block";

    // Calculate position ensuring no overflow
    let rangeX = window.innerWidth - 425; // because the rotating hypotoneuse is longer than width
    let rangeY = window.innerHeight - 425;

    let x = Math.floor(Math.random() * rangeX) + 100;
    let y = Math.floor(Math.random() * rangeY) + 100;

    shape.style.left = `${x}px`;
    shape.style.top = `${y}px`;
  });
}

loadShapePositions();
loadNotes();

import { createNote } from "./note.js";

const input = document.getElementById("note-input");
const pasteButton = document.getElementById("instant-paste");

let noteCounter = 0;

function saveLocalNote(data) {
  const savedNotes = JSON.parse(localStorage.getItem("notes")) || {};
  const key = noteCounter.toString();
  console.log("Saving note ", key);
  savedNotes[key] = data; // set key (index) to current count
  localStorage.setItem("notes", JSON.stringify(savedNotes));
  noteCounter++; // increment the count
  localStorage.setItem("noteCounter", noteCounter);
}

function loadLocalNotes() {
  noteCounter = JSON.parse(localStorage.getItem("noteCounter")) || 0; // init 0
  const savedNotes = JSON.parse(localStorage.getItem("notes")) || {}; // init empty

  Object.entries(savedNotes)
    .sort(([, a], [, b]) => a.noteIndex - b.noteIndex)
    .forEach(([, data]) => {
      createNote(data);
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
  return date;
}


function makeNote(noteText) {
  const date = getDate();
  const data = { noteText, date, noteIndex: noteCounter };
  createNote(data);
  saveLocalNote(data);

  const audio = new Audio('./public/audio/pop.mp3');
  audio.play();
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
  makeNote(noteText)
  input.value = "";
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && input.value.trim() !== "") {
    makeNote(input.value.trim())
    input.value = "";
  }
});

function loadShapePositions() {
  const shapes = document.querySelectorAll('.background-svg');
  shapes.forEach(shape => {
    let x = Math.floor(Math.random() * 100);
    let y = Math.floor(Math.random() * 100);
    let width = Math.floor(Math.random() * 150) + 150; 

    shape.style.top = `${y}%`;
    shape.style.left = `${x}%`;
    console.log(width)
    shape.style.width = `${width}px`;
  });
}


loadLocalNotes();
loadShapePositions();




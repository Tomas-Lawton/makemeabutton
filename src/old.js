const input = document.getElementById("note-input");
const notes = document.getElementById("notes");
let noteCounter = 0; // Track total note count

function createNote(text, formattedDate) {
  noteCounter++; // Increment total note count for each new note

  // NOTE CONTENT
  const noteContent = document.createElement("div");
  noteContent.classList.add("note-content");

  const note = document.createElement("div");
  note.classList.add("note");

  const noteHeading = document.createElement("h3");
  noteHeading.textContent = `Note ${noteCounter}`;
  noteHeading.classList.add("note-heading");

  const noteText = document.createElement("div");
  noteText.textContent = text;
  noteText.classList.add("note-text");

  noteContent.appendChild(noteHeading);
  noteContent.appendChild(noteText);

  //   NOTE ACTIONS
  const actionContainer = document.createElement("div");
  const dateElem = document.createElement("p");
  dateElem.textContent = formattedDate;
  dateElem.classList.add("note-date");

  const copyBtn = document.createElement("button");
  copyBtn.classList.add("copy-btn");

  const icon = document.createElement("div"); // Use a div instead of an <i>
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6" style="width: 16px; height: 16px; margin-right: 5px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
    `;

  icon.style.width = "16px"; // Set the width of the icon
  icon.style.height = "16px"; // Set the height of the icon
  icon.style.display = "inline-block"; // Ensure it displays inline
  icon.style.marginRight = "5px"; // Add some spacing between the icon and the text

  copyBtn.appendChild(icon);
  copyBtn.appendChild(document.createTextNode("Copy"));
  copyBtn.addEventListener("click", () => {
    navigator.clipboard
      .writeText(noteText.textContent)
      .then(() => alert("Note copied to clipboard!"))
      .catch((err) => console.error("Failed to copy text: ", err));
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.classList.add("delete-btn");

  deleteBtn.addEventListener("click", () => {
    note.remove();
    // const data = { noteText, formattedDate }
    // saveNotesToLocalStorage();
  });

  actionContainer.classList.add("note-actions");
  actionContainer.appendChild(dateElem)
  actionContainer.appendChild(copyBtn);
  actionContainer.appendChild(deleteBtn);

  //   NOTE ELEMENTS

  note.appendChild(noteContent);
  note.appendChild(actionContainer);

  note.addEventListener("mouseenter", () => {
    copyBtn.classList.add("active");
    icon.querySelector("svg").style.stroke = "white";
  });

  note.addEventListener("mouseleave", () => {
    copyBtn.classList.remove("active");
    icon.querySelector("svg").style.stroke = "green";
  });

  notes.appendChild(note);
}

function saveNotesToLocalStorage(data) {
  const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
  console.log(savedNotes);
  savedNotes.push(data);
  localStorage.setItem("notes", JSON.stringify(savedNotes));
}

// Load the notes
function loadNotesFromLocalStorage() {
  const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
  console.log(savedNotes);
  savedNotes.forEach((data) => {
    const { noteText, formattedDate } = data;
    createNote(noteText, formattedDate);
  });
}

function getCurentDate() {
    const currentDate = new Date();
    const formattedDate = `${(currentDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${currentDate
        .getDate()
        .toString()
        .padStart(2, "0")}/${currentDate.getFullYear()}`;
    return formattedDate
}

// Event for handling paste and enter key press
input.addEventListener("paste", (event) => {
  const pastedText = (event.clipboardData || window.clipboardData).getData(
    "text"
  );
  event.preventDefault();
  input.value = "";

  const noteText = pastedText;
  const formattedDate = getCurentDate()
  createNote(noteText, formattedDate);
  const data = { noteText, formattedDate };
  saveNotesToLocalStorage(data);
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && input.value.trim() !== "") {
    const noteText = input.value.trim();
    const formattedDate = getCurentDate()
    createNote(noteText, formattedDate);
    const data = { noteText, formattedDate };
    saveNotesToLocalStorage(data);
    input.value = "";
  }
});

// Load notes on page load
loadNotesFromLocalStorage();


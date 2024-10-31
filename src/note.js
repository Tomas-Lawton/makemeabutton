const notes = document.getElementById("notes");

function deleteLocalNote(index) {
  const savedNotes = JSON.parse(localStorage.getItem("notes")) || {};
  console.log("delete, ", index);
  delete savedNotes[index];
  console.log(savedNotes);
  localStorage.setItem("notes", JSON.stringify(savedNotes));

  const audio = new Audio("./public/audio/swish.mp3");
  audio.play();
}

export function createNote({ noteText, date, noteIndex }) {
  console.log("Creating note: ", noteText, date, noteIndex);

  // NOTE CONTENT
  const noteContent = document.createElement("div");
  noteContent.classList.add("note-content");

  const note = document.createElement("div");
  note.classList.add("draggable");
  note.classList.add("note");
  note.setAttribute("draggable", true);

  const noteHeading = document.createElement("h3");
  noteHeading.textContent = `📝 Note ${noteIndex + 1}`; // Display note index + 1 for user-friendly numbering
  noteHeading.classList.add("note-heading");

  const noteTextDiv = document.createElement("div");
  noteTextDiv.textContent = noteText;
  noteTextDiv.classList.add("note-text");

  noteContent.appendChild(noteHeading);
  noteContent.appendChild(noteTextDiv);

  //   NOTE ACTIONS
  const actionContainer = document.createElement("div");
  const dateElem = document.createElement("p");
  dateElem.textContent = date;
  dateElem.classList.add("note-date");

  const copyBtn = document.createElement("button");
  copyBtn.classList.add("copy-btn");

  const icon = document.createElement("div"); // Use a div instead of an <i>
  icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6" style="width: 16px; height: 16px; margin-right: 5px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
      </svg>
    `;

  icon.style.width = "16px";
  icon.style.height = "16px";
  icon.style.display = "inline-block";
  icon.style.marginRight = "5px";

  copyBtn.appendChild(icon);
  copyBtn.appendChild(document.createTextNode("Copy"));

  copyBtn.addEventListener("click", () => {
    navigator.clipboard
      .writeText(noteText)
      .then(() => {
        const allNotes = notes.querySelectorAll(".copy-btn");
        allNotes.forEach((singleNote) => {
          singleNote.childNodes[1].textContent = "Copy";
        });
        copyBtn.childNodes[1].textContent = "Copied";
      })
      .catch((err) => console.error("Failed to copy text: ", err));
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.classList.add("delete-btn");

  deleteBtn.addEventListener("click", () => {
    console.log("deleting note: ", noteIndex);
    note.remove();
    deleteLocalNote(noteIndex); // Remove note using index
  });

  actionContainer.classList.add("note-actions");
  actionContainer.appendChild(dateElem);
  actionContainer.appendChild(copyBtn);
  actionContainer.appendChild(deleteBtn);

  //   NOTE ELEMENTS
  note.appendChild(noteContent);
  note.appendChild(actionContainer);

  // note.addEventListener("mouseenter", () => {
  //   copyBtn.classList.add("active");
  //   icon.querySelector("svg").style.stroke = "white";
  // });

  // note.addEventListener("mouseleave", () => {
  //   copyBtn.classList.remove("active");
  //   icon.querySelector("svg").style.stroke = "green";
  // });

  notes.prepend(note); // switch with append

  
}



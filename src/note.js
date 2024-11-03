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


  // HEADER START
  const noteHeader = document.createElement("div");
  noteHeader.classList.add("note-header");

  let noteHeading = document.createElement("h3");
  noteHeading.textContent = `✍️ Note ${noteIndex + 1}`; // Display note index + 1 for user-friendly numbering
  noteHeading.classList.add("note-title");
  
  const editBtn = document.createElement("div");
  editBtn.classList.add("edit")
  const editIcon = document.createElement("img");
  editIcon.src = "./public/uicons/uicons-round-medium-outline-pencil.svg"
  editBtn.appendChild(editIcon);

  const discardBtn = document.createElement("div");
  discardBtn.classList.add("discard")
  const discardIcon = document.createElement("img")
  discardIcon.src = "./public/uicons/uicons-round-medium-outline-close.svg"
  discardBtn.appendChild(discardIcon);

  const acceptBtn = document.createElement("div");
  acceptBtn.classList.add("accept")
  const acceptIcon = document.createElement("img");
  acceptIcon.src = "./public/uicons/uicons-round-medium-outline-checkmark.svg"
  acceptBtn.appendChild(acceptIcon);

  noteHeader.appendChild(noteHeading);
  noteHeader.appendChild(editBtn);
  noteHeader.appendChild(acceptBtn);
  noteHeader.appendChild(discardBtn);

  // HEADER DONE


  const dateElem = document.createElement("p");
  dateElem.textContent = date;
  dateElem.classList.add("note-date");

  let noteTextDiv = document.createElement("div");
  noteTextDiv.textContent = noteText;
  noteTextDiv.classList.add("note-text");

  noteContent.appendChild(noteHeader);
  noteContent.appendChild(dateElem)
  noteContent.appendChild(noteTextDiv);



  // EDITING LISTEWNERS. TO DO ADD SAVING TO THE STATE AGAIN ALSO FOR REAARAGNING
  let originalTitle = noteHeading.textContent;
  let originalText = noteTextDiv.textContent;

  editBtn.addEventListener("click", () => {
    editBtn.style.display = "none";
    acceptBtn.style.display = "inline-block";
    discardBtn.style.display = "inline-block";
  
    const input1 = document.createElement("input");
    input1.type = "text";
    input1.value = noteHeading.textContent;
    input1.classList.add("note-title")
    noteHeading.replaceWith(input1);
  
    const input2 = document.createElement("input");
    input2.type = "text";
    input2.value = noteTextDiv.textContent;
    noteTextDiv.replaceWith(input2);
  
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
  
    editBtn.style.display = "inline-block";
    acceptBtn.style.display = "none";
    discardBtn.style.display = "none";
  });
  
  discardBtn.addEventListener("click", () => {
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
  
    editBtn.style.display = "inline-block";
    acceptBtn.style.display = "none";
    discardBtn.style.display = "none";
  });

  // 




  //   NOTE ACTIONS
  const actionContainer = document.createElement("div");

  const copyBtn = document.createElement("button");
  copyBtn.classList.add("copy-btn");
  const copyIcon = document.createElement("img"); // Use a div instead of an <i>
  copyIcon.src = "./public/uicons/uicons-round-medium-outline-copy.svg"

  copyBtn.appendChild(copyIcon);
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


  const deleteIcon = document.createElement("img")
  deleteIcon.src = "./public/uicons/uicons-round-medium-outline-trash.svg"
  const deleteBtn = document.createElement("div");
  deleteBtn.appendChild(deleteIcon);
  deleteBtn.classList.add("delete-btn");
  // deleteBtn.textContent = "Delete";

  deleteBtn.addEventListener("click", () => {
    console.log("deleting note: ", noteIndex);
    note.remove();
    deleteLocalNote(noteIndex); // Remove note using index
  });

  actionContainer.classList.add("note-actions");
  actionContainer.appendChild(deleteBtn);
  actionContainer.appendChild(copyBtn);

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



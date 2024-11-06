document.addEventListener("DOMContentLoaded", function () {
  const notesList = document.getElementById("notes-list");
  const openButton = document.getElementById("home");
  const slashCheckbox = document.getElementById("check-5");

  chrome.storage.sync.get("slashCommandsEnabled", (data) => {
    slashCheckbox.checked = data.slashCommandsEnabled ?? true; // Default to true
  });
  slashCheckbox.addEventListener("change", () => {
    const isEnabled = slashCheckbox.checked;
    chrome.storage.sync.set({ slashCommandsEnabled: isEnabled });
  });

  openButton.addEventListener("click", function () {
    chrome.tabs.create({});
  });

  chrome.storage.sync.get("notes", (data) => {
    const notes = data.notes || {};
    notesList.innerHTML = "";

    if (Object.keys(notes).length > 0) {
      Object.keys(notes).forEach((key) => {
        const note = notes[key];
        let li = document.createElement("li");
        li.textContent = note.noteName || `Note ${note.noteIndex + 1}`;
        li.onclick = () => insertNoteIntoActiveTab(note.noteText);
        notesList.prepend(li);
      });
    } else {
      let li = document.createElement("li");
      li.textContent = `Notes appear here. Type “/” followed by the name to insert it.`;
      notesList.appendChild(li);
    }
  });
});

function insertNoteIntoActiveTab(note) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "pasteValue",
        value: note,
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
    const notesList = document.getElementById("notes-list");
    const openButton = document.getElementById("home");
  
    openButton.addEventListener("click", function () {
      chrome.tabs.create({});
    });
  
    chrome.storage.sync.get('notes', (data) => {
      const notes = data.notes || {};
      notesList.innerHTML = '';
  
      Object.keys(notes).forEach((key) => {
        const note = notes[key];
        let li = document.createElement('li');
        li.textContent = note.noteName || `🗒️ Note ${note.noteIndex + 1}`;
        li.onclick = () => insertNoteIntoActiveTab(note.noteText);
        notesList.appendChild(li);
      });
    });
  });
  
  function insertNoteIntoActiveTab(note) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "pasteValue", value: note });
      }
    });
  }
  
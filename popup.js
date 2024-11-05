document.addEventListener("DOMContentLoaded", function () {
  const notesList = document.getElementById("notes-list");

  // Retrieve notes from sync storage
  chrome.storage.sync.get('notes', (data) => {
    const notes = data.notes || {}; // Keep notes as an object
    console.log(notes);
    
    // Clear the notes list before populating
    notesList.innerHTML = '';

    // Populate the list
    Object.keys(notes).forEach((key) => {
        const note = notes[key];
        let li = document.createElement('li');
        li.textContent =  note.noteName || `🗒️ Note ${note.noteIndex + 1}`;
        li.onclick = () => insertNoteIntoActiveTab(note.noteText);
        notesList.appendChild(li);
    });
});
});

function insertNoteIntoActiveTab(note) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            console.log(note)

            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "pasteValue", value: note });
                } else {
                    console.error("No active tab found");
                }
            });
       
        }
    });
}
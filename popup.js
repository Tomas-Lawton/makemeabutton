const neoBrutalismColors = [
  "#FF4F58", // Bold red
  "#00A9A6", // Teal blue
  "#FFBE00", // Bright yellow
  "#00D2B3", // Bright cyan
  "#E60000", // Vivid red
  "#FFD500", // Vivid yellow
  "#F56A79", // Pinkish red
  "#35B7FF", // Bright blue
  "#2A9D8F", // Muted teal
  "#E9A2B9", // Muted pink
  "#FF7F00", // Bright orange
  "#FF9A8B", // Coral pink
  "#D1FF00", // Neon lime
  "#FFD700", // Gold
  "#00FF7F", // Spring green
  "#FF1493", // Deep pink
  "#FF6EC7", // Hot pink
  "#D9E000", // Bright chartreuse
  "#00FFEF", // Cyan green
  "#F76C6C"  // Soft red
];

function getRandomMutedColor() {
    // Pick a random color from the neoBrutalismColors array
    const randomColor = neoBrutalismColors[Math.floor(Math.random() * neoBrutalismColors.length)];
    return randomColor;
}

document.addEventListener("DOMContentLoaded", function () {
  const notesList = document.getElementById("notes-list");
  const openButton = document.getElementById("home");
  const slashCheckbox = document.getElementById("setting-slash");
  const autonameCheckbox = document.getElementById("setting-naming");


  // get settings
  chrome.storage.sync.get("settings", (data) => {
    slashCheckbox.checked = data.settings?.slashCommandsEnabled ?? true;
  });
  
  slashCheckbox.addEventListener("change", () => {
    const isEnabled = slashCheckbox.checked;
    chrome.storage.sync.get("settings", (data) => {
      const updatedSettings = {
        ...data.settings,
        slashCommandsEnabled: isEnabled
      };
      chrome.storage.sync.set({ settings: updatedSettings });
    });
  });

  autonameCheckbox.addEventListener("click", () => {
    const existingContainer = document.querySelector('.oai-key-container');
    
    if (existingContainer) {
      return; // If the container already exists, do nothing
    }
  
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('oai-key-container');
  
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = 'Enter OpenAI Key';
  
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
  
    containerDiv.appendChild(inputField);
    containerDiv.appendChild(saveButton);
  
    autonameCheckbox.parentNode.insertBefore(containerDiv, autonameCheckbox.nextSibling);
  
    saveButton.addEventListener('click', () => {
      const oaiKey = inputField.value;
      chrome.storage.sync.get("settings", (data) => {
        const updatedSettings = {
          ...data.settings,
          oai_key: oaiKey
        };
        chrome.storage.sync.set({ settings: updatedSettings });
        containerDiv.remove();
      });
    });
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
        
        const iconWrapper = document.createElement("div");
        iconWrapper.classList.add("note-icon-wrapper");
        
        const icon = document.createElement("img");
        icon.src = "./public/uicons/uicons-round-medium-outline-tray-in.svg";
        icon.classList.add("note-icon");
        
        iconWrapper.appendChild(icon);
        li.style.backgroundColor = getRandomMutedColor();
        li.appendChild(iconWrapper);
        
        // Create a text node and append it separately
        const noteText = document.createTextNode(note.noteName || `Note ${note.noteIndex + 1}`);
        li.appendChild(noteText);
        
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

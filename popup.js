document.addEventListener("DOMContentLoaded", function () {
  console.log('Loaded Blocknotes Extension Popup.')
  const notesList = document.getElementById("notes-list");
  const openButton = document.getElementById("home");
  const slashCheckbox = document.getElementById("check-5");
  const infoButton = document.getElementById("info");
  const setKeyButton = document.getElementById("setting-naming");
  const autoname = document.getElementById("auto-name-setting")

  chrome.storage.sync.get("settings", (data) => {
    slashCheckbox.checked = data.settings?.useSlashWithCtrl ?? false;
  });

  slashCheckbox.addEventListener("change", () => {
    const isEnabled = slashCheckbox.checked;
    chrome.storage.sync.get("settings", (data) => {
      const updatedSettings = {
        ...data.settings,
        useSlashWithCtrl: isEnabled,
      };
      chrome.storage.sync.set({ settings: updatedSettings });
    });
  });

  infoButton.addEventListener("click", () => {
    window.open("https://ai.google.dev/", "_blank");
  });

  setKeyButton.addEventListener("click", () => {
    // Check if container already exists, if so, remove it
    const existingContainer = document.querySelector(".oai-key-container");
    if (existingContainer) {
      existingContainer.remove();
      return;
    }

    const containerDiv = document.createElement("div");
    containerDiv.classList.add("oai-key-container");

    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.placeholder = "Gemini API Key";

    const saveButton = document.createElement("button");
    saveButton.textContent = "UPDATE";

    containerDiv.appendChild(inputField);
    containerDiv.appendChild(saveButton);

    autoname.parentNode.insertBefore(containerDiv, autoname.nextSibling);

    saveButton.addEventListener("click", () => {
      const AIKEY = inputField.value;
      chrome.storage.sync.get("settings", (data) => {
        const updatedSettings = {
          ...data.settings,
          key: AIKEY,
        };
        chrome.storage.sync.set({ settings: updatedSettings });
        containerDiv.remove();
        console.log("Set Gemini API Key. AIKEY: ",AIKEY || "NONE");
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
        li.style.backgroundColor = "#fed703";
        li.appendChild(iconWrapper);

        // Create a text node and append it separately
        const noteText = document.createTextNode(
          note.noteName || `Note ${note.noteIndex + 1}`
        );
        li.appendChild(noteText);
        li.onclick = () => insertNoteIntoActiveTab(note.noteText);
        notesList.prepend(li);
      });
    } else {
      let li = document.createElement("li");
      li.textContent = `Notes will appear here.`;
      li.style.backgroundColor = "#fed703";
      li.style.pointerEvents = "none"
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

function randomizePositions() {
  const images = document.querySelectorAll(".random-image");
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  images.forEach((image) => {
    // Generate random positions
    const randomX = Math.floor(Math.random() * (windowWidth - 50)); // subtract 50px for the image size
    const randomY = Math.floor(Math.random() * (windowHeight - 50));

    // Apply the random positions
    image.style.left = randomX + "px";
    image.style.top = randomY + "px";
  });
}

randomizePositions();

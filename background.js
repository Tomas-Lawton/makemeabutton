// first time initialisation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ notes: {} });
  chrome.storage.sync.set({ noteCounter: 0 });
  chrome.storage.sync.set({ slashCommandsEnabled: true });
  chrome.storage.sync.set({ firstLoad: true });
  console.log("Extension installed successfully.");
});

// chrome.storage.local.set({
//   notes: {
//     0: {
//       date: "11/07/2024",
//       displayIndex: 0,
//       noteIndex: 3,
//       noteName: "Hello, world!",
//       noteText: "This is your first BlockNote... :)",
//     },
//   },
// });

chrome.action.onClicked.addListener(async (tab) => {
  console.log("Action clicked, creating iframe");
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const oldIframe = document.getElementById("cm-frame");
      if (oldIframe) {
        oldIframe.remove();
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.id = "cm-frame";
      iframe.style.cssText = `
          top: 10px;
          right: -400px; /* Start off-screen */
          width: 370px;
          height: 785px;
          z-index: 2147483650;
          border: none;
          position: fixed;
          border-radius: 2.1rem;
          overflow: hidden;
          background: none;
          transition: right 0.3s ease; /* Add transition for animation */
        `;
      iframe.src = chrome.runtime.getURL("popup.html"); // Ensure this file is accessible

      // Append the iframe first to make it part of the document
      document.body.appendChild(iframe);

      // Trigger the animation by changing the right property
      setTimeout(() => {
        iframe.style.right = "10px"; // Move into view
      }, 10); // Short delay to allow the iframe to be rendered first
    },
  });
});

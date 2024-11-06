import { playPop } from "./sounds.js";

// Detect screen width initially
let isVerticalOnly = window.innerWidth <= 1000;

export function updateDragDropListeners() {
  const draggables = document.querySelectorAll(".draggable");
  const containers = document.querySelectorAll(".container");

  // Update the drag mode on resize events
  window.addEventListener("resize", () => {
    isVerticalOnly = window.innerWidth <= 1000;
    handleDragHandleVisibility();  // Recheck drag handle visibility on resize
  });

  draggables.forEach((draggable) => {
    let originalContainer = null;
    let originalIndex = null;

    // Select the drag handle within the draggable note
    const dragHandle = draggable.querySelector('.drag-handle');

    // Desktop drag events
    draggable.addEventListener("dragstart", () => {
      draggable.classList.add("dragging");
      originalContainer = draggable.closest(".container");
      originalIndex = Array.from(originalContainer.children).indexOf(draggable);
    });

    draggable.addEventListener("dragend", () => {
      draggable.classList.remove("dragging");
      const newContainer = draggable.closest(".container");
      if (newContainer) {
        updateDisplayIndexes();
        playPop();
      }
    });

    // Touch drag events (for touch devices, we'll only start dragging on the drag-handle)
    if (dragHandle) {
      dragHandle.addEventListener("touchstart", (e) => {
        e.preventDefault();
        draggable.classList.add("dragging");
        originalContainer = draggable.closest(".container");
        originalIndex = Array.from(originalContainer.children).indexOf(draggable);
      });

      dragHandle.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const container = draggable.closest(".container");
        
        const afterElement = getDragAfterElement(container, touch.clientX, touch.clientY);

        draggable.style.position = "absolute";

        // For vertical-only screens (small screens), move only vertically
        if (isVerticalOnly) {
          draggable.style.top = `${touch.clientY - draggable.offsetHeight / 2}px`; // Align with touch position on Y-axis
        } else {
          // Full X-Y movement for larger screens
          draggable.style.left = `${touch.clientX - draggable.offsetWidth / 2}px`;
          draggable.style.top = `${touch.clientY - draggable.offsetHeight / 2}px`;
        }

        // Insert draggable element in the correct position
        if (afterElement == null) {
          container.appendChild(draggable);
        } else {
          container.insertBefore(draggable, afterElement);
        }
      });

      dragHandle.addEventListener("touchend", (e) => {
        e.preventDefault();
        draggable.style.position = "static";
        draggable.classList.remove("dragging");
        const newContainer = draggable.closest(".container");
        if (newContainer) {
          updateDisplayIndexes();
          playPop();
        }
      });
    }

    // Prevent drag initiation if touch is not on the drag handle
    draggable.addEventListener("touchstart", (e) => {
      if (e.target !== dragHandle) {
        e.stopPropagation(); // Prevent drag if the target is not the drag-handle
      }
    });
  });

  containers.forEach((container) => {
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(container, e.clientX, e.clientY);
      const draggable = document.querySelector(".dragging");

      if (afterElement == null) {
        container.appendChild(draggable);
      } else {
        container.insertBefore(draggable, afterElement);
      }
    });
  });
}

// Function to get the nearest element after which to place the dragged element
function getDragAfterElement(container, x, y) {
  const draggableElements = [
    ...container.querySelectorAll(".draggable:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child, index) => {
      const box = child.getBoundingClientRect();
      const nextBox =
        draggableElements[index + 1] &&
        draggableElements[index + 1].getBoundingClientRect();

      // Check if we are within the same row
      const inRow = y - box.bottom <= 0 && y - box.top >= 0;
      const offsetX = x - (box.left + box.width / 2);

      // For vertical-only dragging, we only care about the Y-axis
      if (inRow) {
        if (offsetX < 0 && offsetX > closest.offset) {
          return {
            offset: offsetX,
            element: child,
          };
        } else {
          // If not in the same row, check if the next box is in the new row
          if (
            nextBox && // There's a box after this one
            y - nextBox.top <= 0 && // The next box is in a new row
            closest.offset === Number.NEGATIVE_INFINITY // We didn't find a fit in the current row
          ) {
            return {
              offset: 0,
              element: draggableElements[index + 1],
            };
          }
          return closest;
        }
      } else {
        return closest;
      }
    },
    {
      offset: Number.NEGATIVE_INFINITY,
    }
  ).element;
}

export function updateDisplayIndexes() {
  const notesElements = document.querySelectorAll(".note");
  const totalNotes = notesElements.length;

  chrome.storage.sync.get("notes", (data) => {
    const savedNotes = data.notes || {}; 

    notesElements.forEach((noteElem, i) => {
      const dataKey = noteElem.getAttribute("key");

      if (savedNotes[dataKey]) {
        savedNotes[dataKey].displayIndex = totalNotes - 1 - i; // Reverse index order
        noteElem.setAttribute("display-index", totalNotes - 1 - i); // Set display index
      }
    });

    chrome.storage.sync.set({ notes: savedNotes }, () => {
      console.log("Notes saved:", savedNotes);
    });
  });
}

function handleDragHandleVisibility() {
  const dragHandles = document.querySelectorAll('.drag-handle');
  const isVerticalOnly = window.innerWidth <= 1000;

  dragHandles.forEach(handle => {
    if (isVerticalOnly) {
      handle.style.display = 'block'; // Show drag handle for small screens
    } else {
      handle.style.display = 'none'; // Hide drag handle for larger screens
    }
  });
}

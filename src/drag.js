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

  // Handle drag and touch events for each draggable note
  draggables.forEach((draggable) => {
    let originalContainer = null;
    const dragHandle = draggable.querySelector('.drag-handle');

    function handleDragStart() {
      draggable.classList.add("dragging");
      originalContainer = draggable.closest(".container");
    }

    function handleDragEnd() {
      draggable.classList.remove("dragging");
      const newContainer = draggable.closest(".container");
      
      if (newContainer && originalContainer !== newContainer) {
        updateDisplayIndexes();  // Update if moved to another container
        playPop();
      } else {
        updateDisplayIndexes();  // Update if stayed in same container
        playPop();
      }
    }

    draggable.addEventListener("dragstart", handleDragStart);
    draggable.addEventListener("dragend", handleDragEnd);

    if (dragHandle) {
      dragHandle.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handleDragStart();
      });

      dragHandle.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const container = draggable.closest(".container");
        const afterElement = getDragAfterElement(container, touch.clientX, touch.clientY);

        draggable.style.position = "absolute";

        // Ensure both x and y are updated for non-vertical screens
        if (isVerticalOnly) {
          draggable.style.top = `${touch.clientY - draggable.offsetHeight / 2}px`;
        } else {
          draggable.style.left = `${touch.clientX - draggable.offsetWidth / 2}px`;
          draggable.style.top = `${touch.clientY - draggable.offsetHeight / 2}px`;
        }

        if (afterElement == null) {
          container.appendChild(draggable);
        } else {
          container.insertBefore(draggable, afterElement);
        }
      });

      dragHandle.addEventListener("touchend", (e) => {
        e.preventDefault();
        draggable.style.position = "static";
        handleDragEnd();
      });
    }

    draggable.addEventListener("touchstart", (e) => {
      if (e.target !== dragHandle) {
        e.stopPropagation();
      }
    });

    if (dragHandle) {
      dragHandle.addEventListener("mousedown", (e) => e.stopPropagation());
      dragHandle.addEventListener("touchstart", (e) => e.stopPropagation());
    }
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

function getDragAfterElement(container, x, y) {
  const draggableElements = [
    ...container.querySelectorAll(".draggable:not(.dragging)"),
  ];

  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };

  draggableElements.forEach((child) => {
    const box = child.getBoundingClientRect();
    const offsetY = y - (box.top + box.height / 2);
    const offsetX = x - (box.left + box.width / 2);

    const isCloser = isVerticalOnly
      ? offsetY < 0 && offsetY > closest.offset
      : offsetY < 0 && offsetX < 0 && offsetY > closest.offset;

    if (isCloser) {
      closest = { offset: offsetY, element: child };
    }
  });

  return closest.element;
}

export function updateDisplayIndexes() {
  const notesElements = document.querySelectorAll(".note");
  const totalNotes = notesElements.length;

  chrome.storage.sync.get("notes", (data) => {
    const savedNotes = data.notes || {}; 

    notesElements.forEach((noteElem, i) => {
      const dataKey = noteElem.getAttribute("key");

      if (savedNotes[dataKey]) {
        savedNotes[dataKey].displayIndex = totalNotes - 1 - i; // Save in reverse order
        noteElem.setAttribute("display-index", totalNotes - 1 - i); // Reverse order
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
      handle.style.display = 'block';
    } else {
      handle.style.display = 'none';
    }
  });
}

import { playPop } from "./sounds.js";

export function updateDragDropListeners() {
  const draggables = document.querySelectorAll(".draggable");
  const containers = document.querySelectorAll(".container");

  draggables.forEach((draggable) => {
    let originalContainer = null;
    let originalIndex = null;


    // For the individual notes
    draggable.addEventListener("dragstart", () => {
      draggable.classList.add("dragging");
      originalContainer = draggable.closest(".container"); // Track the starting container
      originalIndex = Array.from(originalContainer.children).indexOf(draggable); // Track the starting index
    });

    draggable.addEventListener("dragend", () => {
      draggable.classList.remove("dragging");

      const newContainer = draggable.closest(".container");
      const newIndex = Array.from(newContainer.children).indexOf(draggable);

      // Play sound only if the draggable was moved within the same container or to a different container
      if (newContainer && (newContainer !== originalContainer || newIndex !== originalIndex)) {
        playPop();
        console.log(`moved from i=${originalIndex} to i=${newIndex}`)
      }
    });
  });

  // For the note container looking at all notes
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
  return draggableElements.reduce(
    (closest, child, index) => {
      const box = child.getBoundingClientRect();
      const nextBox =
        draggableElements[index + 1] &&
        draggableElements[index + 1].getBoundingClientRect();
      const inRow = y - box.bottom <= 0 && y - box.top >= 0; // check if this is in the same row
      const offset = x - (box.left + box.width / 2);
      if (inRow) {
        if (offset < 0 && offset > closest.offset) {
          return {
            offset: offset,
            element: child,
          };
        } else {
          if (
            // handle row ends,
            nextBox && // there is a box after this one.
            y - nextBox.top <= 0 && // the next is in a new row
            closest.offset === Number.NEGATIVE_INFINITY // we didn't find a fit in the current row.
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

// Group notes by URL for creating collections
function groupNotesByUrl(notes) {
    return notes.reduce((groups, note) => {
    const url = note.url;
    if (!groups[url]) {
    groups[url] = [];
    }
    groups[url].push(note);
    return groups;
    }, {});
    }
    
    // Delete a note with the given timestamp
    function deleteNote(timestamp, callback) {
    chrome.storage.local.get({ notes: [] }, (result) => {
    let notes = result.notes || [];
    // Optionally, use a unique ID instead of timestamp.
    notes = notes.filter(note => note.timestamp !== timestamp);

    chrome.storage.local.set({ notes: notes }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error deleting note:", chrome.runtime.lastError);
      } else {
        console.log("Note deleted successfully.");
        if (typeof callback === "function") {
          callback();
        }
      }
    });
    
    });
    }
    
    // Function to update an edited note
    function updateNote(updatedNote, callback) {
    chrome.storage.local.get({ notes: [] }, (result) => {
    let notes = result.notes || [];
    const noteIndex = notes.findIndex(note => note.timestamp === updatedNote.timestamp);
    if (noteIndex > -1) {
    notes[noteIndex] = updatedNote;
    }
    chrome.storage.local.set({ notes: notes }, () => {
    if (chrome.runtime.lastError) {
    console.error("Error updating note:", chrome.runtime.lastError);
    } else {
    console.log("Note updated successfully.");
    if (typeof callback === "function") {
    callback();
    }
    }
    });
    });
    }
    
    // Render individual note element (used when viewing a collection’s individual notes)
    function renderNote(note, filter) {
    const noteElement = document.createElement("div");
    noteElement.classList.add("noteItem");
    noteElement.style.border = `3px solid ${note.color}`;
    
    // Create container for note content
    const contentDiv = document.createElement("div");
    contentDiv.className = "noteContent";
    
    // Elements for note title, annotated text, timestamp and URL.
    // note.note is editable.
    const titleDiv = document.createElement("h2");
    titleDiv.textContent = note.note;
    titleDiv.className = "noteTitle";
    
    const annotatedTextDiv = document.createElement("div");
    annotatedTextDiv.innerHTML = `<strong>Annotated Text:</strong> <span>${note.text}</span>`;
    
    const timestampDiv = document.createElement("div");
    timestampDiv.innerHTML = `<span>Saved on: ${new Date(note.timestamp).toLocaleString()}</span>`;
    
    const urlDiv = document.createElement("div");
    urlDiv.innerHTML = `<span>Source: <a href="${note.url}" target="_blank">${note.url}</a></span>`;
    
    // Append elements to contentDiv
    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(annotatedTextDiv);
    contentDiv.appendChild(timestampDiv);
    contentDiv.appendChild(urlDiv);
    
    // Container for action buttons
    const btnContainer = document.createElement("div");
    btnContainer.className = "noteActions";
    
    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("deletebtn");
    deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
    deleteBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this note?")) {
    deleteNote(note.timestamp, () => {
    loadAllNotes(filter);
    });
    }
    });
    
    // Edit button with toggle for save
    const editBtn = document.createElement("button");
    editBtn.classList.add("editbtn");
    editBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i>`;
    
    let isEditing = false;
    editBtn.addEventListener("click", () => {
    if (!isEditing) {
    isEditing = true;
    // Change icon to check for saving
    editBtn.innerHTML = `<i class="fa-solid fa-check"></i>`;

      // Replace titleDiv with an input field
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = note.note;
      titleInput.className = "editTitleInput";
      contentDiv.replaceChild(titleInput, titleDiv);
    
      // Add color picker below title input
      const colorContainer = document.createElement("div");
      colorContainer.style.marginTop = "5px";
      const colorLabel = document.createElement("label");
      colorLabel.textContent = "Color: ";
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = note.color;
      colorInput.style.verticalAlign = "middle";
      colorContainer.appendChild(colorLabel);
      colorContainer.appendChild(colorInput);
      contentDiv.appendChild(colorContainer);
    
    } else {
      // Save mode: capture updated title and color
      const titleInput = contentDiv.querySelector(".editTitleInput");
      if (!titleInput) return;
      const newTitle = titleInput.value;
    
      const colorInput = contentDiv.querySelector("input[type='color']");
      const newColor = colorInput ? colorInput.value : note.color;
    
      const updatedNote = {
        ...note,
        note: newTitle,
        color: newColor
      };
    
      updateNote(updatedNote, () => {
        loadAllNotes(filter);
      });
    }
    
    });
    
    btnContainer.appendChild(deleteBtn);
    btnContainer.appendChild(editBtn);
    
    noteElement.appendChild(contentDiv);
    noteElement.appendChild(btnContainer);
    return noteElement;
    }
    
    // Load all notes, grouped by site. The viewMode parameter decides if you want to view individual notes or collections.
    function loadAllNotes(filter = "", viewIndividual = false) {
    const notesContainer = document.getElementById("notesContainer");
    chrome.storage.local.get({ notes: [] }, (result) => {
    let notes = result.notes || [];

    // Apply filtering if provided (case-insensitive).
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      notes = notes.filter(note =>
        note.text.toLowerCase().includes(lowerFilter) ||
        note.note.toLowerCase().includes(lowerFilter) ||
        note.url.toLowerCase().includes(lowerFilter)
      );
    }
    
    if (notes.length === 0) {
      notesContainer.innerHTML = "No notes found.";
      return;
    }
    
    // Group notes by URL
    const groups = groupNotesByUrl(notes);
    notesContainer.innerHTML = "";
    
    // For each collection, show a summary box. Add a toggle to show/hide the individual notes.
    Object.entries(groups).forEach(([url, groupNotes]) => {
      const groupBox = document.createElement("div");
      groupBox.className = "groupBox";
      groupBox.style.border = "2px solid #666";
      groupBox.style.margin = "10px";
      groupBox.style.padding = "10px";
      groupBox.style.borderRadius = "5px";
      
      const header = document.createElement("div");
      header.className = "groupHeader";
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
    
      const title = document.createElement("h3");
      title.textContent = url;
      title.style.margin = "0";
      const countSpan = document.createElement("span");
      countSpan.textContent = `(${groupNotes.length} note${groupNotes.length !== 1 ? "s" : ""})`;
      title.appendChild(document.createTextNode(" "));
      title.appendChild(countSpan);
    
      // Container for header right-side actions.
      const groupActions = document.createElement("div");
    
      // Toggle button: if viewIndividual is true, hide the notes; otherwise show them.
      const toggleBtn = document.createElement("button");
      toggleBtn.classList.add('collectionBoxBtn');
      toggleBtn.textContent = viewIndividual ? "Hide Individual Notes" : "View Individual Notes";
      toggleBtn.addEventListener("click", () => {
        // Toggle view for this group.
        const notesDiv = groupBox.querySelector(".groupNotes");
        if (notesDiv) {
          if (notesDiv.style.display === "none") {
            notesDiv.style.display = "block";
            toggleBtn.textContent = "Hide Individual Notes";
          } else {
            notesDiv.style.display = "none";
            toggleBtn.textContent = "View Individual Notes";
          }
        }
      });
      groupActions.appendChild(toggleBtn);
    
      // Export collection button
      const exportBtn = document.createElement("button");
      exportBtn.classList.add('collectionBoxBtn');
      exportBtn.textContent = "Export Collection";
      exportBtn.style.marginLeft = "5px";
      exportBtn.addEventListener("click", () => {
        exportCollection(groupNotes);
      });
      groupActions.appendChild(exportBtn);
    
      header.appendChild(title);
      header.appendChild(groupActions);
    
      groupBox.appendChild(header);
    
      // Container for individual notes (if toggled visible)
      const groupNotesDiv = document.createElement("div");
      groupNotesDiv.className = "groupNotes";
      // If viewIndividual=false, start with them hidden
      groupNotesDiv.style.display = viewIndividual ? "block" : "none";
    
      groupNotes.forEach(note => {
        const noteElem = renderNote(note, filter);
        groupNotesDiv.appendChild(noteElem);
      });
      
      groupBox.appendChild(groupNotesDiv);
    
      notesContainer.appendChild(groupBox);
    });
    
    });
    }
    
    // Export all notes as JSON (for all notes)
    function exportAllNotes() {
    chrome.storage.local.get({ notes: [] }, (result) => {
    const notes = result.notes || [];
    const jsonString = JSON.stringify(notes, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const timestamp = Date.now();
    const filename = `notes-export-${timestamp}.json`;
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    });
    }
    
    // Export a specific collection of notes as JSON
    function exportCollection(notes) {
    const jsonString = JSON.stringify(notes, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const timestamp = Date.now();
    const filename = `collection-export-${timestamp}.json`;
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    }
    
    // Event listeners
    document.getElementById("search").addEventListener("input", (e) => {
    const filter = e.target.value;
    loadAllNotes(filter);
    });
    
    document.getElementById("exportNotes").addEventListener("click", () => {
    exportAllNotes();
    });
    
    document.getElementById("toggleView").addEventListener("click", (e) => {
        // Get the toggle button element
        const toggleBtn = e.target;
        
        // Determine the new mode based on the current text on the button
        // (Button shows "View Individual Notes" when the current view is collections.)
        let viewIndividual;
        if (toggleBtn.textContent.trim() === "Expand All Notes") {
          viewIndividual = true;
          toggleBtn.textContent = "Collapse All Notes";
        } else {
          viewIndividual = false;
          toggleBtn.textContent = "Expand All Notes";
        }
        
        // Load notes using the current filter and chosen view mode.
        const filter = document.getElementById("search").value;
        loadAllNotes(filter, viewIndividual);
      });

    // Load notes on DOM ready with default view (collections with notes hidden)
    document.addEventListener("DOMContentLoaded", () => {
    loadAllNotes("", false);
    });
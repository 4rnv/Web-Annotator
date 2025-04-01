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

function deleteNote(timestamp, callback) {
    chrome.storage.local.get({ notes: [] }, (result) => {
        let notes = result.notes || [];
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

function renderNote(note, filter) {
    const noteElement = document.createElement("div");
    noteElement.classList.add("noteItem");
    noteElement.style.border = `3px solid ${note.color}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "noteContent";

    const titleDiv = document.createElement("h2");
    titleDiv.textContent = note.note;
    titleDiv.className = "noteTitle";

    const annotatedTextDiv = document.createElement("div");
    annotatedTextDiv.innerHTML = `<strong>Annotated Text:</strong> <span>${note.text}</span>`;

    const timestampDiv = document.createElement("div");
    timestampDiv.innerHTML = `<span>Saved on: ${new Date(note.timestamp).toLocaleString()}</span>`;

    const urlDiv = document.createElement("div");
    urlDiv.innerHTML = `<span>Source: <a href="${note.url}" target="_blank">${note.url}</a></span>`;

    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(annotatedTextDiv);
    contentDiv.appendChild(timestampDiv);
    contentDiv.appendChild(urlDiv);

    const btnContainer = document.createElement("div");
    btnContainer.className = "noteActions";

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

    const editBtn = document.createElement("button");
    editBtn.classList.add("editbtn");
    editBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i>`;

    let isEditing = false;
    editBtn.addEventListener("click", () => {
        if (!isEditing) {
            isEditing = true;
            editBtn.innerHTML = `<i class="fa-solid fa-check"></i>`;

            const titleInput = document.createElement("input");
            titleInput.type = "text";
            titleInput.value = note.note;
            titleInput.className = "editTitleInput";
            contentDiv.replaceChild(titleInput, titleDiv);

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

function loadAllNotes(filter = "", viewIndividual = false) {
    const notesContainer = document.getElementById("notesContainer");
    chrome.storage.local.get({ notes: [] }, (result) => {
        let notes = result.notes || [];

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

        const groups = groupNotesByUrl(notes);
        notesContainer.innerHTML = "";

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

            const groupActions = document.createElement("div");

            const toggleBtn = document.createElement("button");
            toggleBtn.classList.add('collectionBoxBtn');
            toggleBtn.textContent = viewIndividual ? "Hide Individual Notes" : "View Individual Notes";
            toggleBtn.addEventListener("click", () => {
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

            const groupNotesDiv = document.createElement("div");
            groupNotesDiv.className = "groupNotes";
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

function exportAllNotes() {
    chrome.storage.local.get({ notes: [] }, (result) => {
        const notes = result.notes || [];
        const jsonString = JSON.stringify(notes, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const timestamp = Date.now();
        const filename = `notes-export-${timestamp}.json`;

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    });
}

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
document.getElementById("search").addEventListener("input", (e) => {
    const filter = e.target.value;
    loadAllNotes(filter);
});

document.getElementById("exportNotes").addEventListener("click", () => {
    exportAllNotes();
});

document.getElementById("toggleView").addEventListener("click", (e) => {
    const toggleBtn = e.target;
    let viewIndividual;
    if (toggleBtn.textContent.trim() === "Expand All Notes") {
        viewIndividual = true;
        toggleBtn.textContent = "Collapse All Notes";
    } else {
        viewIndividual = false;
        toggleBtn.textContent = "Expand All Notes";
    }
    const filter = document.getElementById("search").value;
    loadAllNotes(filter, viewIndividual);
});

document.addEventListener("DOMContentLoaded", () => {
    loadAllNotes("", false);
});
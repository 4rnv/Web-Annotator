function getRelativeTime(timestamp) {
    const ts = new Date(timestamp).getTime();
    const now = Date.now();
    const diffMs = now - ts;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    else {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
}

// Function to toggle expanded state of a note element
function toggleExpand(noteElement) {
    const detailsDiv = noteElement.querySelector(".note-details");
    const toggleButtonIcon = noteElement.querySelector(".toggleBtn i");
    if (detailsDiv.style.display === "none" || detailsDiv.style.display === "") {
        detailsDiv.style.display = "flex";
        detailsDiv.style.flexDirection = "column";
        toggleButtonIcon.classList.remove("fa-plus");
        toggleButtonIcon.classList.add("fa-minus");
    }
    else {
        detailsDiv.style.display = "none";
        //These icons are not so good
        toggleButtonIcon.classList.remove("fa-minus");
        toggleButtonIcon.classList.add("fa-plus");
    }
}

// Function to load and display notes with an optional filter
function loadNotes(filter = "") {
    const lowerFilter = filter.toLowerCase();
    const notesContainer = document.getElementById("notesContainer");
    chrome.storage.local.get({ notes: [] }, (result) => {
        let allNotes = result.notes || [];
        if (allNotes.length === 0) {
            notesContainer.innerHTML = "Add a note.";
            return;
        }
        // If filtering, search across all notes, otherwise sort descending and limit to 10 most recent.
        if (lowerFilter) {
            allNotes = allNotes.filter(note =>
                note.text.toLowerCase().includes(lowerFilter) ||
                note.note.toLowerCase().includes(lowerFilter) ||
                note.url.toLowerCase().includes(lowerFilter)
            );
        } else {
            //allNotes.sort((a, b) => b.timestamp - a.timestamp);
            allNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            allNotes = allNotes.slice(0, 10);
        }
        // Clear the container
        notesContainer.innerHTML = "";
        allNotes.forEach(note => {
            // Create a wrapper element for the note
            const noteElement = document.createElement("div");
            noteElement.className = "note";
            //noteElement.style.backgroundColor = note.color;
            noteElement.style.border = `2px solid ${note.color}`;

            // Create the minimized content – note.note and relative time.
            const minimizedContent = `
            <div class="note-summary"><strong>Note:</strong> ${note.note}<br>
            <em>${getRelativeTime(note.timestamp)}</em></div>`;

            // Create the details section (initially hidden)
            const detailsContent = `
            <div class="note-details" style="display: none; margin-top: 8px;">
            <div><strong>Text:</strong> ${note.text}</div>
            <div><strong>Saved on:</strong> ${new Date(note.timestamp).toLocaleString()}</div>
            <div>
            <strong>Source:</strong><a href="${note.url}" target="_blank">${note.url}</a>
            </div></div>`;

            // Create the toggle button with an icon
            const toggleBtn = document.createElement("button");
            toggleBtn.className = "toggleBtn";
            // Use an <i> element to hold the Font Awesome icon, starting with plus icon.
            toggleBtn.innerHTML = `<i class="fa-solid fa-plus"></i>`;

            // Add a click event to toggle the note expand/collapse.
            toggleBtn.addEventListener("click", () => {
                toggleExpand(noteElement);
            });

            // Set inner HTML for the note element
            noteElement.innerHTML = minimizedContent + detailsContent;
            noteElement.appendChild(toggleBtn);

            notesContainer.appendChild(noteElement);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("search").addEventListener("input", (e) => {
        const filter = e.target.value;
        loadNotes(filter);
    });
    document.getElementById("openAllPageBtn").addEventListener("click", () => {
        window.open("allnotes.html", "_blank");
    });
    loadNotes("");
});
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

function loadNotes(filter = "") {
    const lowerFilter = filter.toLowerCase();
    const notesContainer = document.getElementById("notesContainer");
    chrome.storage.local.get({ notes: [] }, (result) => {
        let allNotes = result.notes || [];
        if (allNotes.length === 0) {
            notesContainer.innerHTML = "Add a note.";
            return;
        }

        if (lowerFilter) {
            allNotes = allNotes.filter(note =>
                note.text.toLowerCase().includes(lowerFilter) ||
                note.note.toLowerCase().includes(lowerFilter) ||
                note.url.toLowerCase().includes(lowerFilter)
            );
        } else {
            allNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            allNotes = allNotes.slice(0, 10);
        }
        notesContainer.innerHTML = "";
        allNotes.forEach(note => {
            const noteElement = document.createElement("div");
            noteElement.className = "note";
            //noteElement.style.backgroundColor = note.color;
            noteElement.style.border = `2px solid ${note.color}`;

            const minimizedContent = `
            <div class="note-summary"><strong>Note:</strong> ${note.note}<br>
            <em>${getRelativeTime(note.timestamp)}</em></div>`;

            const detailsContent = `
            <div class="note-details" style="display: none; margin-top: 8px;">
            <div><strong>Text:</strong> ${note.text}</div>
            <div><strong>Saved on:</strong> ${new Date(note.timestamp).toLocaleString()}</div>
            <div>
            <strong>Source:</strong><a href="${note.url}" target="_blank">${note.url}</a>
            </div></div>`;

            const toggleBtn = document.createElement("button");
            toggleBtn.className = "toggleBtn";
            toggleBtn.innerHTML = `<i class="fa-solid fa-plus"></i>`;

            toggleBtn.addEventListener("click", () => {
                toggleExpand(noteElement);
            });

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
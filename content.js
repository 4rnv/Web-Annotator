// Function to inject CSS for the tooltip, textarea, and buttons.
function injectTooltipStyles() {
  // Check if styles already injected.
  if (document.getElementById("annotationStyles")) return;

  const style = document.createElement("style");
  style.id = "annotationStyles";
  style.innerHTML = `
    /* Base styles for tooltip container */
    #annotationTooltip {
      display: flex;
      flex-direction: column;
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 40vw;
      height: 40vh;
      padding: 20px;
      z-index: 10000;
      border: 2px solid;
      border-radius: 5px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      transition: all 0.3s;
    }
    
    /* Base styles for textarea */
    #annotationTooltip .noteText {
      flex: 1;
      width: -webkit-fill-available;
      width: -moz-available;
      padding: 8px;
      margin-bottom: 10px;
      border: 1px solid;
      border-radius: 4px;
      resize: none;
      font-size: 1rem;
      transition: all 0.3s;
    }
    
    /* Styles for label and color input */
    #annotationTooltip label {
      margin-bottom: 5px;
    }
    
    #annotationTooltip .colorPicker {
      margin-bottom: 10px;
      width: 40px;
      height: 30px;
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
    }
    
    #highlightLabel {
      font-family: Segoe UI, system-ui, sans-serif;
    }
    
    /* Styles for buttons */
    #annotationTooltip button {
      padding: 6px 12px;
      margin-right: 5px;
      border: 1px solid;
      border-radius: 4px;
      cursor: pointer;
      background: none;
      font-size: 1rem;
      transition: background-color 0.3s, border-color 0.3s;
    }
    
    #annotationTooltip button:hover {
      border: 2px solid;
    }
    
    /* Light theme */
    @media (prefers-color-scheme: light) {
      #annotationTooltip {
        background-color: #fff;
        color: #333;
        border-color: #999;
      }
      
      #annotationTooltip .noteText {
        background-color: #f5f5f5;
        color: #333;
        border-color: #ccc;
      }
      
      #annotationTooltip button {
        border-color: #999;
        color: #333;
      }
    }
    
    /* Dark theme */
    @media (prefers-color-scheme: dark) {
      #annotationTooltip {
        background-color: #1e1e1e;
        color: #f1f1f1;
        border-color: #555;
      }
      
      #annotationTooltip .noteText {
        background-color: #2d2d2d;
        font-family: Segoe UI, system-ui, sans-serif;
        color: #fff;
        border-color:rgb(82, 82, 82);
      }
      
      #annotationTooltip button {
        border-color: #777;
        color: #f1f1f1;
      }
    }
  `;
  document.head.appendChild(style);
}

function createTooltip(selection) {
  injectTooltipStyles();
  const originalText = selection.toString();
  
  const oldTooltip = document.getElementById("annotationTooltip");
  if (oldTooltip) {
    oldTooltip.remove();
  }
  
  const tooltip = document.createElement("div");
  tooltip.id = "annotationTooltip";
  
  tooltip.innerHTML = `
    <textarea class="noteText" placeholder="Type your note here..." required></textarea>
    <label id="highlightLabel">Highlight Color:</label>
    <input type="color" class="colorPicker" value="#ffff00">
    <div>
      <button class="saveNote">Save</button>
      <button class="cancelNote">Cancel</button>
    </div>`;
  document.body.appendChild(tooltip);
  
  tooltip.querySelector(".saveNote").onclick = () => {
    const noteText = tooltip.querySelector(".noteText").value;
    const color = tooltip.querySelector(".colorPicker").value;
    
    if (noteText) {
      const noteData = {
        text: originalText,
        note: noteText,
        color: color,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
    
      saveNoteToStorage(noteData, () => {
        console.log("Note saved.");
      });
      tooltip.remove();
    }
  };
  
  tooltip.querySelector(".cancelNote").onclick = () => {
    tooltip.remove();
  };
}

function saveNoteToStorage(noteData, callback) {
  chrome.storage.local.get({ notes: [] }, (result) => {
    const notes = result.notes;
    notes.push(noteData);
    chrome.storage.local.set({ notes: notes }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving note:", chrome.runtime.lastError);
      } else {
        console.log("Note saved successfully.");
        if (typeof callback === "function") {
          callback();
        }
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "annotate") {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      createTooltip(selection);
      sendResponse({ status: "ok" });
    } else {
      sendResponse({ status: "no-selection" });
    }
  }
});

function notesForCurrentPage() {
  chrome.storage.local.get({ notes: [] }, (result) => {
    const notes = result.notes.filter(note => note.url === window.location.href);
    console.log("Saved notes for this page:", notes);
    return notes;
  });
}

window.addEventListener("load", notesForCurrentPage);
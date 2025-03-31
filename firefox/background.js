chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "annotate") {
        try {
            if (tab && tab.id) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["content.js"],
                });
                // doesn't work without setTimeout
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, { action: "annotate" }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Message send error:", chrome.runtime.lastError);
                        }
                        else {
                            console.log("Message response:", response);
                        }
                    });
                }, 100);
            }
            else {
                console.error("No valid tab found");
            }
        } catch (error) {
            console.error("Error executing script:", error);
        }
    }
});
    
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
    id: "annotate",
    title: "Annotate",
    contexts: ["selection"],
    });
});
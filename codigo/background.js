// Service Worker - Intermediario de mensajes
// Guarda el tabId activo y retransmite mensajes incluso cuando el popup está cerrado

let activeTabId = null;
let isRunning = false;

// Escuchar mensajes desde popup y content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Si viene del popup (action = iniciar/detener)
  if (message.action === "observarChats") {
    console.log("[Background] Observador iniciado, guardando tabId:", sender.tab?.id);
    activeTabId = sender.tab?.id;
    isRunning = true;
    chrome.storage.local.set({ activeTabId, isRunning });
  } 
  
  if (message.action === "detenerChats") {
    console.log("[Background] Detener enviado a tabId:", activeTabId);
    isRunning = false;
    chrome.storage.local.set({ isRunning });
    
    // Retransmitir el mensaje al content script activo
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, { action: "detenerChats" }).catch(() => {
        // Si el tab no existe, limpiar
        activeTabId = null;
        chrome.storage.local.set({ activeTabId: null });
      });
    }
  }
  
  // Si viene del content script, retransmitir al popup si está abierto
  if (message.action === "popupEvent") {
    chrome.runtime.sendMessage(message).catch(() => {
      // El popup está cerrado, ignorar
    });
  }
});

// Limpiar si el tab se cierra
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    console.log("[Background] Tab cerrado:", tabId);
    activeTabId = null;
    isRunning = false;
    chrome.storage.local.set({ activeTabId: null, isRunning: false });
  }
});

// Cargar estado al iniciar
chrome.storage.local.get(['activeTabId', 'isRunning'], (result) => {
  activeTabId = result.activeTabId || null;
  isRunning = result.isRunning || false;
  console.log("[Background] Estado cargado:", { activeTabId, isRunning });
});

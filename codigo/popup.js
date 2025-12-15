// Estado del popup
const popupState = {
  isRunning: false,
  chatsProcessed: 0,
  mapeosGuardados: 0,
  urlsEsperandoLetra: 0,
  errores: 0,
  events: [],
  maxEvents: 20
};

// Helper para agregar eventos al log
function addEvent(message, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('es-AR', { hour12: false });
  
  popupState.events.unshift({
    message,
    type,
    time
  });
  
  // Mantener solo los últimos maxEvents
  if (popupState.events.length > popupState.maxEvents) {
    popupState.events.pop();
  }
  
  // Si es error, incrementar contador
  if (type === 'error') {
    popupState.errores++;
  }
  
  updateEventLog();
  updateStats();
}

// Actualizar log visual
function updateEventLog() {
  const eventLog = document.getElementById('eventLog');
  eventLog.innerHTML = popupState.events.map(event => `
    <div class="event-item event-${event.type}">
      <span class="event-time">[${event.time}]</span> ${event.message}
    </div>
  `).join('');
  
  // Auto scroll al inicio
  eventLog.scrollTop = 0;
}

// Actualizar estadísticas
function updateStats() {
  document.getElementById('statChats').textContent = popupState.chatsProcessed;
  document.getElementById('statMapeos').textContent = popupState.mapeosGuardados;
  document.getElementById('statPausado').textContent = popupState.urlsEsperandoLetra;
  document.getElementById('statError').textContent = popupState.errores;
}

// Actualizar estado
function updateStatus(running, status = null) {
  const indicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const btn = document.getElementById('observarChatsBtn');
  const stopBtn = document.getElementById('detenerChatsBtn');
  
  popupState.isRunning = running;
  
  if (running) {
    indicator.className = 'status-indicator active';
    statusText.textContent = status || '🟢 Ejecutándose';
    btn.disabled = true;
    stopBtn.disabled = false;
  } else {
    indicator.className = 'status-indicator inactive';
    statusText.textContent = '⚫ Inactivo';
    btn.disabled = false;
    stopBtn.disabled = true;
  }
}

document.getElementById("observarChatsBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  updateStatus(true, '🟢 Iniciando observación...');
  addEvent('Iniciando observación de chats', 'info');
  
  chrome.tabs.sendMessage(tab.id, { action: "observarChats" });
  
  // Abrir monitor automáticamente
  openMonitor();
});

document.getElementById("detenerChatsBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  updateStatus(false);
  addEvent('Observación detenida por usuario', 'warning');
  
  chrome.tabs.sendMessage(tab.id, { action: "detenerChats" });
});

// Abrir monitor en ventana separada
function openMonitor() {
  const monitorUrl = chrome.runtime.getURL('codigo/monitor.html');
  window.open(monitorUrl, 'AutoTagMonitor', 'width=650,height=900,left=100,top=100');
}

// Botón para abrir monitor manualmente
document.getElementById("abrirMonitorBtn")?.addEventListener("click", openMonitor);

// Escuchar mensajes desde el content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "popupEvent") {
    const { event, type = 'info', data } = message;
    
    switch(event) {
      case 'chatProcessed':
        popupState.chatsProcessed++;
        addEvent(`Chat procesado ${data.panel || 'desconocido'}`, 'success');
        break;
      case 'urlMapped':
        popupState.mapeosGuardados++;
        addEvent(`✅ Mapeado: ${data.url} → ${data.letra}`, 'success');
        break;
      case 'urlWaiting':
        popupState.urlsEsperandoLetra++;
        addEvent(`⏸️ URL esperando letra: ${data.url}`, 'warning');
        break;
      case 'observerStarted':
        updateStatus(true, '🟢 Observación activa');
        addEvent('Observador iniciado correctamente', 'success');
        break;
      case 'observerStopped':
        updateStatus(false);
        addEvent('Observador detenido', 'info');
        break;
      case 'error':
        addEvent(`❌ Error: ${data.message}`, 'error');
        break;
      case 'panelDetected':
        addEvent(`Panel detectado: ${data.panel}`, 'info');
        break;
      default:
        addEvent(event, type);
    }
  }
});

// Estado inicial
updateStatus(false);
addEvent('Panel cargado', 'info');

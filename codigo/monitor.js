// Estado del monitor
const monitorState = {
  isRunning: false,
  chatsProcessed: 0,
  mapeosGuardados: 0,
  urlsEsperandoLetra: 0,
  errores: 0,
  events: [],
  maxEvents: 50
};

// Cargar estado almacenado
function loadState() {
  chrome.storage.local.get(['monitorState'], (result) => {
    if (result.monitorState) {
      Object.assign(monitorState, result.monitorState);
      updateUI();
    }
  });
}

// Guardar estado
function saveState() {
  chrome.storage.local.set({ monitorState });
}

// Agregar evento
function addEvent(message, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('es-AR', { hour12: false });
  
  monitorState.events.unshift({
    message,
    type,
    time
  });
  
  if (monitorState.events.length > monitorState.maxEvents) {
    monitorState.events.pop();
  }
  
  if (type === 'error') {
    monitorState.errores++;
  }
  
  updateEventLog();
  updateStats();
  saveState();
}

// Actualizar log visual
function updateEventLog() {
  const eventLog = document.getElementById('eventLog');
  
  if (monitorState.events.length === 0) {
    eventLog.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div>Sin eventos aún</div>
      </div>
    `;
    return;
  }
  
  eventLog.innerHTML = monitorState.events.map(event => `
    <div class="event-item event-${event.type}">
      <span class="event-time">[${event.time}]</span> ${event.message}
    </div>
  `).join('');
}

// Actualizar estadísticas
function updateStats() {
  document.getElementById('statChats').textContent = monitorState.chatsProcessed;
  document.getElementById('statMapeos').textContent = monitorState.mapeosGuardados;
  document.getElementById('statPausado').textContent = monitorState.urlsEsperandoLetra;
  document.getElementById('statError').textContent = monitorState.errores;
}

// Actualizar UI
function updateUI() {
  updateEventLog();
  updateStats();
  updateStatusIndicator();
}

// Actualizar indicador de estado
function updateStatusIndicator() {
  const indicator = document.getElementById('statusIndicator');
  const title = document.getElementById('statusTitle');
  const desc = document.getElementById('statusDesc');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  
  if (monitorState.isRunning) {
    indicator.className = 'status-indicator active';
    title.textContent = '🟢 Ejecutándose';
    desc.textContent = 'Observer activo procesando chats';
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    indicator.className = 'status-indicator inactive';
    title.textContent = '⚫ Inactivo';
    desc.textContent = 'Click en Iniciar para comenzar';
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

// Botones
document.getElementById('startBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  monitorState.isRunning = true;
  updateStatusIndicator();
  addEvent('Iniciando observación de chats', 'info');
  saveState();
  
  chrome.tabs.sendMessage(tab.id, { action: "observarChats" });
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  monitorState.isRunning = false;
  updateStatusIndicator();
  addEvent('Observación detenida por usuario', 'warning');
  saveState();
  
  chrome.tabs.sendMessage(tab.id, { action: "detenerChats" });
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('¿Limpiar todo el historial de eventos?')) {
    monitorState.events = [];
    monitorState.chatsProcessed = 0;
    monitorState.mapeosGuardados = 0;
    monitorState.urlsEsperandoLetra = 0;
    monitorState.errores = 0;
    updateUI();
    saveState();
    addEvent('Historial limpiado', 'info');
  }
});

// Escuchar mensajes desde el content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "popupEvent") {
    const { event, type = 'info', data } = message;
    
    switch(event) {
      case 'chatProcessed':
        monitorState.chatsProcessed++;
        addEvent(`✅ Chat procesado: ${data.panel || 'desconocido'}`, 'success');
        break;
      case 'urlMapped':
        monitorState.mapeosGuardados++;
        addEvent(`✅ Mapeado: ${data.url} → ${data.letra}`, 'success');
        break;
      case 'urlWaiting':
        monitorState.urlsEsperandoLetra++;
        addEvent(`⏸️ Esperando letra: ${data.url}`, 'warning');
        break;
      case 'observerStarted':
        monitorState.isRunning = true;
        updateStatusIndicator();
        addEvent('Observer iniciado correctamente', 'success');
        break;
      case 'observerStopped':
        monitorState.isRunning = false;
        updateStatusIndicator();
        addEvent('Observer detenido', 'info');
        break;
      case 'error':
        addEvent(`❌ Error: ${data.message}`, 'error');
        break;
      case 'panelDetected':
        addEvent(`🎯 Panel detectado: ${data.panel}`, 'info');
        break;
      default:
        addEvent(event, type);
    }
    
    saveState();
  }
});

// Cargar estado al abrir
loadState();
addEvent('Monitor abierto', 'info');

# Tageador para Clientify

Extensión de Chrome para automatización de etiquetado y seguimiento de campañas en Clientify.

## Características

- 🔄 **Observación continua**: Monitoreo automático de chats cada 30 segundos
- 🏷️ **Nomenclatura automática**: Generación de códigos DD-MM-ID[Letra][!]
- 🔗 **Detección múltiple de URLs**: Identifica todas las URLs de Meta por chat
- ✅ **Detección de cargas**: Marca automática cuando se confirma el pago
- 📊 **Visualización por panel**: Datos organizados por panel y campaña
- 📋 **Exportación**: Copia datos formateados al portapapeles

## Estructura del Proyecto

```
tageador-master/
├── manifest.json              # Configuración de la extensión
├── popup.html/popup.js        # Interfaz del popup
├── content.js                 # Panel de visualización de datos
├── chatObserver.js            # Observer principal con loop continuo
├── chatTagger.js              # Módulo de etiquetado automático
├── paneles-config.json        # Mapeo ID→Nombre de paneles
└── elementos observer/
    ├── message-detector.js    # Detector de mensajes
    ├── panel-detector.js      # Detector de paneles
    ├── url-detector.js        # Extractor de URLs y nomenclaturas
    └── url-mapper.js          # Mapeo URL→Letra de campaña
```

## Instalación

1. Descargar el proyecto
2. Abrir Chrome → `chrome://extensions/`
3. Activar "Modo de desarrollador"
4. Click en "Cargar extensión sin empaquetar"
5. Seleccionar la carpeta del proyecto

## Uso

1. **Iniciar Observación**: Click en el botón del popup
2. **Asignar letras**: Cuando aparezca el modal, asignar A, B, C a cada URL
3. **Ver Datos**: Abre el panel lateral con estadísticas
4. **Copiar**: Exporta el reporte al portapapeles

## Formato de Nomenclatura

`DD-MM-ID[Letra][!]`

- **DD-MM**: Día y mes
- **ID**: Número de panel
- **Letra**: A, B, C (campaña)
- **!**: Indica que se detectó mensaje de carga

Ejemplo: `13-12-19A!` = Panel 19, Campaña A, con carga confirmada, del 13 de diciembre

## Tecnologías

- JavaScript ES6+
- Chrome Extension Manifest V3
- LocalStorage para persistencia
- DOM Manipulation
- Audio API para alertas

## Licencia

MIT

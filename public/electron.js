const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Crear la ventana principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'favicon.ico'), // Asegurate de tener un icono
    show: false, // No mostrar hasta que esté listo
    titleBarStyle: 'default'
  });

  // Cargar la aplicación
  // En producción, `__dirname` apunta a ".../resources/app/public".
  // Debemos subir un nivel y cargar "../dist/index.html".
  const isDev = !app.isPackaged;
  const prodIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${prodIndexPath}`;
  
  console.log('Cargando URL:', startUrl);
  console.log('__dirname:', __dirname);
  
  mainWindow.loadURL(startUrl).catch(err => {
    console.error('Error cargando la URL:', err);
  });

  // Mostrar cuando esté listo
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Maximizar en modo desarrollo
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Error al cargar la página:', errorCode, errorDescription);
  });

  // Manejar el cierre de ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Crear menú personalizado
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de desarrollador' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de KimiPOS',
          click: () => {
            // Aquí puedes mostrar información sobre la aplicación
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Este método será llamado cuando Electron haya terminado la inicialización
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Seguridad: Prevenir navegación no autorizada
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    // Prevenir abrir nuevas ventanas
    navigationEvent.preventDefault();
  });
});

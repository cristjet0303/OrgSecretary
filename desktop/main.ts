import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'OrgSecretary Offline',
    backgroundColor: '#F5F7FA',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  registerIpcHandlers();

  // In production load dist/OrgSecretary/browser/index.html, in dev load local dev server
  const distPath = path.join(__dirname, '../dist/OrgSecretary/browser/index.html');
  if (app.isPackaged || !process.env['ELECTRON_START_URL']) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL(process.env['ELECTRON_START_URL']);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

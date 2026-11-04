const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

let mainWindow = null

// Configure autoUpdater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 650,
    title: 'AuditSpace',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    autoHideMenuBar: true,
    backgroundColor: '#09090b',
  })

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Auto-check for updates after app loads (if not dev)
  mainWindow.webContents.once('did-finish-load', () => {
    if (!isDev) {
      setTimeout(() => {
        try {
          autoUpdater.checkForUpdates().catch((err) => {
            console.log('Update check on launch error:', err.message)
          })
        } catch (e) {
          console.log('Update check error:', e)
        }
      }, 3000)
    }
  })
}

// IPC Handlers for AutoUpdater
ipcMain.on('check-for-updates', (_event, token) => {
  try {
    if (token) {
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'abdifaizal',
        repo: 'auditspace',
        private: true,
        token: token,
      })
    }
    autoUpdater.checkForUpdates().catch((err) => {
      mainWindow?.webContents.send('update-error', err.message || 'Gagal mengecek pembaruan.')
    })
  } catch (err) {
    mainWindow?.webContents.send('update-error', err.message)
  }
})

ipcMain.on('download-update', () => {
  try {
    autoUpdater.downloadUpdate().catch((err) => {
      mainWindow?.webContents.send('update-error', err.message || 'Gagal mengunduh pembaruan.')
    })
  } catch (err) {
    mainWindow?.webContents.send('update-error', err.message)
  }
})

ipcMain.on('quit-and-install', () => {
  autoUpdater.quitAndInstall(false, true)
})

// AutoUpdater Event Forwarding
autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info)
})

autoUpdater.on('update-not-available', (info) => {
  mainWindow?.webContents.send('update-not-available', info)
})

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('download-progress', progressObj)
})

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update-downloaded', info)
})

autoUpdater.on('error', (err) => {
  mainWindow?.webContents.send('update-error', err == null ? 'unknown' : (err.message || err).toString())
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  var menu = Menu.buildFromTemplate([{
        label: 'Menu',
        submenu: [
            {
              label:'Save Project As...',
              click() {
                mainWindow.webContents.send('editor', 'save');
              }
            },
            {
              label:'Open Project',
              click() {
                mainWindow.webContents.send('editor', 'open');
              }
            },
            {
              label:'Run Project',
              click() {
                mainWindow.webContents.send('editor', 'run');
              }
            },
            {
              label:'Exit', 
              click() { 
                  app.quit() 
              } 
          }
        ]
    }]);

  Menu.setApplicationMenu(menu); 
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

//Python
const spawn = require("child_process").spawn;
const pythonProcess = spawn('python3',["./src/python/server.py"/*, arg1, arg2, ...*/]);

pythonProcess.stdout.on('data', (data) => {
    //console.log('writing');
    console.log(data.toString());
});

process.on('exit', () => {
    console.log('killing python processes');
    pythonProcess.kill();
});
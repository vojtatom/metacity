const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
    icon: __dirname + '/icons/metacity.png'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools();
  mainWindow.setMenuBarVisibility(false)
  
  /*var menu = Menu.buildFromTemplate([{
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
  
  Menu.setApplicationMenu(menu); */
  Menu.setApplicationMenu(null);
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


app.commandLine.appendSwitch('enable-features', 'FormControlsRefresh');

//Python
const os = require('os');

const platformPythonPath = {
  win32: '/python/install/python.exe',
  //darwin: 'python3',
  linux: '/python/install/bin/python3.8'
};

const pythonPath = platformPythonPath[os.platform()];
if (pythonPath == undefined)
  throw 'OS not supported'

console.log(__dirname);

let python = __dirname + pythonPath;
let script = __dirname + '/py/server.py'

const spawn = require("child_process").spawn;
const pythonProcess = spawn(python, [script/*, arg1, arg2, ...*/]);

pythonProcess.stdout.on('data', (data) => {
    //console.log('writing');
    console.log(data.toString());
});

process.on('exit', () => {
    console.log('killing python processes');
    pythonProcess.kill();
});
const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('path');

const START_URL = process.env.ELECTRON_START_URL || 'https://jewel-crm.vercel.app';

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 1024,
		minHeight: 700,
		show: false,
		backgroundColor: '#121212',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true,
		}
	});

	mainWindow.once('ready-to-show', () => mainWindow.show());

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		// Open external links in default browser
		shell.openExternal(url);
		return { action: 'deny' };
	});

	mainWindow.loadURL(START_URL).catch((err) => {
		console.error('Failed to load URL:', err);
		dialog.showErrorBox('Network Error', 'Unable to load the app URL. Check your internet connection.');
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

// Basic menu with reload and devtools in development
function buildMenu() {
	const isMac = process.platform === 'darwin';
	const template = [
		...(isMac ? [{ role: 'appMenu' }] : []),
		{
			label: 'View',
			submenu: [
				{ role: 'reload' },
				{ role: 'forceReload' },
				{ type: 'separator' },
				{ role: 'toggleDevTools' },
				{ type: 'separator' },
				{ role: 'resetZoom' },
				{ role: 'zoomIn' },
				{ role: 'zoomOut' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' }
			]
		},
		{ role: 'windowMenu' }
	];
	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
	buildMenu();
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});



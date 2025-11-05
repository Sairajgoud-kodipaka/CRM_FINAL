const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('path');

const START_URL = process.env.ELECTRON_START_URL || 'https://jewel-crm.vercel.app';
const USE_OFFLINE = process.env.ELECTRON_USE_OFFLINE === '1';

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 1024,
		minHeight: 700,
		show: false,
    backgroundColor: '#121212',
    icon: path.join(__dirname, '..', 'public', 'icon.ico'),
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

	const loadApp = async () => {
		if (USE_OFFLINE) {
			// Try loading the statically exported app from /out
			const devOut = path.join(__dirname, '..', 'out', 'index.html');
			const prodOut = path.join(process.resourcesPath, 'app', 'out', 'index.html');
			const fileToLoad = await safeFirstExisting([devOut, prodOut]);
			if (fileToLoad) {
				await mainWindow.loadFile(fileToLoad);
				return;
			}
		}

		await mainWindow.loadURL(START_URL);
	};

	loadApp().catch((err) => {
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

function safeFirstExisting(paths) {
	const fs = require('fs');
	return new Promise((resolve) => {
		for (const p of paths) {
			try {
				if (fs.existsSync(p)) {
					resolve(p);
					return;
				}
			} catch (_) {}
		}
		resolve(null);
	});
}



// Expose a minimal safe bridge if needed later
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
	platform: process.platform,
});



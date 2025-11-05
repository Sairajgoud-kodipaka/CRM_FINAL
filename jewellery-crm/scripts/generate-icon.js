// Generate Windows .ico from explicit standard sizes to satisfy NSIS
const fs = require('fs');
const path = require('path');
const os = require('os');
let toIco;
try { toIco = require('to-ico'); } catch (_) { toIco = null; }
let Jimp;
try { Jimp = require('jimp'); } catch (_) { Jimp = null; }

if (!Jimp) {
	console.error('Jimp is required. Install with: npm i -D jimp');
	process.exit(1);
}
if (!toIco) {
	console.error('to-ico is required. Install with: npm i -D to-ico');
	process.exit(1);
}

const TARGET_SIZES = [256, 128, 64, 48, 32, 16];

async function prepareBasePng(sourcePng, backgroundHex) {
	const src = await Jimp.read(sourcePng);
	const size = Math.max(src.getWidth(), src.getHeight());
	const canvasSize = Math.max(256, size); // at least 256
	const bg = new Jimp(canvasSize, canvasSize, backgroundHex || '#ffffff');
	// contain within 90% of canvas
	const maxEdge = Math.floor(canvasSize * 0.9);
	const fitted = src.getWidth() > maxEdge || src.getHeight() > maxEdge
		? src.clone().contain(maxEdge, maxEdge, Jimp.RESIZE_BILINEAR)
		: src;
	const x = Math.floor((canvasSize - fitted.getWidth()) / 2);
	const y = Math.floor((canvasSize - fitted.getHeight()) / 2);
	bg.composite(fitted, x, y);
	const tmp = path.join(os.tmpdir(), `icon-base-${Date.now()}.png`);
	await bg.writeAsync(tmp);
	return tmp;
}

async function run() {
	try {
		const projectRoot = path.resolve(__dirname, '..');
		const publicDir = path.join(projectRoot, 'public');
		const override = process.env.ICON_PNG ? path.resolve(projectRoot, process.env.ICON_PNG) : null;
		const candidates = [
			override,
			path.join(publicDir, 'icon-512.png'),
			path.join(publicDir, 'manifest-icon-512.maskable.png'),
			path.join(publicDir, 'favicon-196.png'),
			path.join(publicDir, 'apple-icon-180.png'),
		].filter(Boolean);
		const sourcePng = candidates.find(p => fs.existsSync(p));
		if (!sourcePng) {
			console.error('No source PNG found. Checked:', candidates.join(', '));
			process.exit(1);
		}

		const bgHex = process.env.ICON_BG || '#ffffff';
		const basePngPath = await prepareBasePng(sourcePng, bgHex);
		const base = await Jimp.read(basePngPath);
		const buffers = [];
		for (const size of TARGET_SIZES) {
			const resized = base.clone().resize(size, size, Jimp.RESIZE_BILINEAR);
			buffers.push(await resized.getBufferAsync(Jimp.MIME_PNG));
		}

		const icoBuffer = await toIco(buffers);
		const outPath = path.join(publicDir, 'icon.ico');
		fs.writeFileSync(outPath, icoBuffer);
		console.log('✔ Generated', outPath, 'with sizes', TARGET_SIZES.join(','), 'from', sourcePng, `(bg ${bgHex})`);
	} catch (err) {
		console.error('Failed to generate icon.ico:', err && err.stack ? err.stack : (err.message || err));
		process.exit(1);
	}
}

run();



/**
 * Local Development Server with Instant Resume Disk-Sync API
 * Run: node dev-server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API: Save Resume directly to disk
    if (req.method === 'POST' && req.url === '/api/save-resume') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const pdfB64 = data.pdfBase64;
                const filename = data.filename || 'Akshat_Vishwakarma_Resume.pdf';

                if (!pdfB64) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing pdfBase64' }));
                    return;
                }

                const pdfBuffer = Buffer.from(pdfB64, 'base64');
                const targetDirs = [__dirname, 'c:/Users/Akshat/portfolio_repo', 'c:/Users/Akshat/Videos/fnf'];

                targetDirs.forEach(dir => {
                    try {
                        if (fs.existsSync(dir)) {
                            // 1. Write PDF file
                            const pdfPath = path.join(dir, filename);
                            fs.writeFileSync(pdfPath, pdfBuffer);

                            // 2. Sync embedded base64 in index.html
                            const htmlPath = path.join(dir, 'index.html');
                            if (fs.existsSync(htmlPath)) {
                                let html = fs.readFileSync(htmlPath, 'utf8');
                                if (html.includes('const RESUME_B64 = "')) {
                                    html = html.replace(/const RESUME_B64 = "[^"]+";/, `const RESUME_B64 = "${pdfB64}";`);
                                    fs.writeFileSync(htmlPath, html, 'utf8');
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error saving to ' + dir + ':', e.message);
                    }
                });

                console.log('✅ [Admin Vault] Saved updated ' + filename + ' and updated index.html on disk successfully!');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Saved resume and updated index.html on disk successfully!' }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Static File Serving
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/' || reqUrl === '') reqUrl = '/index.html';

    const filePath = path.join(__dirname, decodeURIComponent(reqUrl));
    const ext = path.extname(filePath).toLowerCase();

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Portfolio local server running at http://localhost:${PORT}`);
    console.log(`🔐 Admin Vault: Triple-click the AKSHAT logo, passcode: manuram`);
});

// Simple HTTPS server for local development
const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();

// Serve static files
app.use(express.static(__dirname));

// Self-signed certificate (for development only)
const options = {
    key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost-cert.pem'))
};

https.createServer(options, app).listen(3000, () => {
    console.log('HTTPS Server running at https://localhost:3000/');
    console.log('Open https://localhost:3000/index.html in your browser');
});

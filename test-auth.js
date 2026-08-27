const http = require('http');

const data = JSON.stringify({
  username: "testuser",
  password: "password123"
});

const req = http.request('http://localhost:3000/api/auth/callback/credentials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.on('data', (chunk) => console.log(`BODY: ${chunk}`));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();

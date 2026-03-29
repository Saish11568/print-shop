const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', d => {
    data += d;
  });
  res.on('end', () => console.log('BODY:', data));
});

req.on('error', error => {
  console.error(error);
});

req.write(JSON.stringify({ email: 'test@test.com', password: 'test', role: 'student' }));
req.end();

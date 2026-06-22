const http = require('http');
http.get('http://localhost:5175/', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data);
    process.exit(0);
  });
}).on('error', (e) => { console.error(e); process.exit(1); });

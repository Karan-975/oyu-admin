const http = require('http');
http.get('http://localhost:5175/src/index.css', (res) => {
  let data = '';
  console.log('StatusCode:', res.statusCode);
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('--- CSS START ---\n');
    console.log(data.slice(0, 2000));
    console.log('\n--- CSS END (truncated) ---');
    process.exit(0);
  });
}).on('error', (e) => { console.error(e); process.exit(1); });

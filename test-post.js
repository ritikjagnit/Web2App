const http = require('http');

const data = JSON.stringify({
  user_id: "test",
  website_url: "https://example.com",
  app_name: "Test",
  short_name: "Test",
  theme_color: "#000",
  background_color: "#fff",
  sourceType: "url",
  htmlContent: "",
  iconUrl: "",
  cacheStrategy: "CacheFirst",
  plan: "free",
  target_platform: "android",
  android_build_format: "apk"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/pwa/build',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', (e) => console.error('Fetch error:', e));
req.write(data);
req.end();

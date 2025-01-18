import { createServer } from 'cors-anywhere';

const host = 'localhost';
const port = 8080;

createServer({
    originWhitelist: [], // 全てのオリジンを許可
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, function() {
    console.log('CORS Anywhere running on ' + host + ':' + port);
}); 
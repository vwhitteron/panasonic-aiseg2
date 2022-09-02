import * as http from 'http';
import * as fs from 'fs';

const requestListener = function (req, res) {
  const filename = req.url.replace(/\//g, '_');

  fs.readFile(`./test/fixtures/${filename}.html`, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404, `Invalid URL: ${err}`);
    } else {
      res.writeHead(200, { 'Content-Type': 'text.html' });
      res.write(data);
    }
    res.end();
  });
};

const Server = http.createServer(requestListener);

export = Server;
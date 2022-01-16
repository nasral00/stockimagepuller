const request = require("request");

function download(url, path, callback) {
  request.head(url, (err, res, body) => {
    request(url).pipe(fs.createWriteStream(path)).on("close", callback);
  });
}

module.exports = download();

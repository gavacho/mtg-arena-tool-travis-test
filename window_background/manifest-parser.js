/*
global
  fs,
  path,
  electron
*/

/**
 * This is meant to replace our current implementation of card data
 * to alleviate the dependency of manual updates from the server.
 * It downloads all cards data, including
 **/

const gunzip = require("gunzip-file");
var http = require("https");
let manifestRequested = false;
const appData = (electron.app || electron.remote.app).getPath("userData");

function requestManifestData(version) {
  if (manifestRequested) return;

  version = version.replace(".", "_");
  let externalURL = `https://assets.mtgarena.wizards.com/External_${version}.mtga`;

  let manifestId = httpGetText(externalURL);
  console.log("Manifest:", manifestId);
  let manifestUrl = `https://assets.mtgarena.wizards.com/Manifest_${manifestId}.mtga`;

  httpGetFile(manifestUrl, `Manifest_${manifestId}.mtga`, file => {
    let outFile = path.join(appData, "external", "manifest.json");
    gunzip(file, outFile, () => {
      fs.unlink(file, () => {});
      processManifest();
    });
  });
}

function processManifest() {
  let manifestJson = path.join(appData, "external", "manifest.json");
  let str = fs.readFileSync(manifestJson);
  let manifestData = JSON.parse(str);

  manifestData.Assets.forEach(asset => {
    if (asset.AssetType == "Data") {
      let assetUrl = `https://assets.mtgarena.wizards.com/${asset.Name}`;

      let regex = new RegExp("_(.*)_", "g");
      let assetName = regex.exec(asset.Name)[1];
      httpGetFile(assetUrl, assetName, file => {
        let outFile = path.join(appData, "external", assetName + ".json");
        gunzip(file, outFile, () => {
          fs.unlink(file, () => {});
          // assetName + ".json"
          // process files here
        });
      });
    }
  });
}

function httpGetText(url) {
  let xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url, false);
  xmlHttp.send(null);
  return xmlHttp.responseText;
}

function httpGetFile(url, file, callback) {
  file = path.join(appData, "external", file);

  let dir = path.join(appData, "external");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  let stream = fs.createWriteStream(file);
  http.get(url, response => {
    response.pipe(stream);

    response.on("end", () => {
      callback(file);
    });
  });
}

module.exports = {
  requestManifestData: requestManifestData
};

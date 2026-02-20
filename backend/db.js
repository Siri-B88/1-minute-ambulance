const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data.json");

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };
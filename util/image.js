var path = require("path");
var fs = require("fs");

getImage = (name, separator, basePath) => {
  return new Promise((resolve, reject) => {
    if (!name || name.split(separator).length !== 2) {
      reject(404);
    } else {
      let nameRes = name.split(separator);
      const filePath = path.resolve(
        __dirname,
        `../public/images/${basePath}/${nameRes[0]}.${nameRes[1]}`
      );
      resolve(filePath);
    }
  });
};

setImage = (name, type, basePath, filepath) => {
  return new Promise((resolve, reject) => {
    try {
      fs.writeFileSync(
        `public/images/${basePath}/${name + "." + type}`,
        fs.readFileSync(filepath)
      );
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

delImage = (file, basePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(`public/images/${basePath}/${file}`, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

hasImage = (file, basePath) => {
  return new Promise((resolve, reject) => {
    try {
      resolve(fs.existsSync(`public/images/${basePath}/${file}`));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  getImage,
  setImage,
  delImage,
  hasImage,
};

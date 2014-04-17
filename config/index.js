var path = require('path'),
  rootDirectory = path.dirname(module.parent.filename);

var Config = { };

Config.dir = {
  root: rootDirectory,
  storage: path.join(rootDirectory, './storage'),
  controller: path.join(rootDirectory, './app/controllers'),
  model: path.join(rootDirectory, './app/models'),
  view: path.join(rootDirectory, './app/views')
};

Config.db = {
  tableName: {
    problem: 'problem',
    submission: 'submission'
  }
};

module.exports = Config;

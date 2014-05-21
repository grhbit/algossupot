var path = require('path'),
  rootDirectory = path.dirname(module.parent.filename);

var Config = { };

Config.dir = {
  root: rootDirectory,
  storage: path.join(rootDirectory, './storage'),
  problem: path.join(rootDirectory, './storage', './problem'),
  submission: path.join(rootDirectory, './storage', './submission'),
  app: path.join(rootDirectory, './app'),
  model: path.join(rootDirectory, './app/models'),
  view: path.join(rootDirectory, './app/views')
};

Config.judge = {
  script: path.join(rootDirectory, './judge/py/start.py')
};

Config.state = [
  'Pending',
  'Accepted',
  'Wrong Answer',
  'Compiling',
  'Compile Error',
  'Memory Limit Exceed',
  'Output Limit Exceed',
  'Time Limit Exceed',
  'Runtime Error',
  'Internal Error'
];

Config.lang = {
  list: [
    'C++'
  ],
  ext: {
    'C++': 'cpp'
  }
};

module.exports = Config;

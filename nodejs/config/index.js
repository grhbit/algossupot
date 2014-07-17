var path = require('path'),
  rootDirectory = path.dirname(module.parent.filename),
  storageDirectory = '/data/storage';

var Config = { };

Config.dir = {
  root: rootDirectory,
  storage: storageDirectory,
  problem: path.join(storageDirectory, './problem'),
  submission: path.join(storageDirectory, './submission'),
  app: path.join(rootDirectory, './app'),
  model: path.join(rootDirectory, './app/models'),
  view: path.join(rootDirectory, './app/views')
};

Config.judge = {
  script: path.join(rootDirectory, './judge/pyjudge/start.py')
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
    'cpp',
    'python',
    'ruby'
  ],
  ext: {
    'cpp': 'cpp',
    'python': 'py',
    'ruby': 'rb'
  }
};

module.exports = Config;

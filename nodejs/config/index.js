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
  'WrongAnswer',
  'CompileError',
  'MemoryLimitExceed',
  'OutputLimitExceed',
  'TimeLimitExceed',
  'RuntimeError',
  'InternalError'
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

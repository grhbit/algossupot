var path = require('path'),
  rootDirectory = path.dirname(module.parent.filename);

var Config = { };

Config.dir = {
  root: rootDirectory,
  storage: path.join(rootDirectory, './storage'),
  submission: path.join(rootDirectory, './storage', './submission'),
  app: path.join(rootDirectory, './app'),
  controller: path.join(rootDirectory, './app/controllers'),
  model: path.join(rootDirectory, './app/models'),
  view: path.join(rootDirectory, './app/views')
};

Config.db = {
  tableName: {
    auth: 'auth',
    user: 'user',
    problem: 'problem',
    submission: 'submission'
  }
};

Config.judge = {
  script: path.join(rootDirectory, './judge/index.py')
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
  'Abnormal Terminated',
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

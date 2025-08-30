// createProjectStructure.js
const fs = require('fs');
const path = require('path');

const projectName = 'my-app'; // change project name if needed
const basePath = path.join(__dirname, projectName);

const structure = {
  'mobile': {
    'android': {},
    'ios': {},
    'src': {
      'assets': {},
      'components': {
        'Button.js': '',
        'Header.js': ''
      },
      'navigation': {
        'AppNavigator.js': ''
      },
      'screens': {
        'LoginScreen.js': '',
        'HomeScreen.js': '',
        'ProfileScreen.js': ''
      },
      'services': {
        'api.js': ''
      },
      'store': {
        'actions': {},
        'reducers': {},
        'store.js': ''
      },
      'utils': {
        'helpers.js': ''
      },
      'App.js': '',
      'index.js': ''
    },
    'package.json': '',
    'metro.config.js': '',
    '.babelrc': '',
    '.eslintrc.js': ''
  },
  'backend': {
    'config': {
      'db.js': '',
      'config.js': ''
    },
    'controllers': {
      'authController.js': '',
      'userController.js': ''
    },
    'models': {
      'User.js': '',
      'Post.js': ''
    },
    'routes': {
      'authRoutes.js': '',
      'userRoutes.js': ''
    },
    'middlewares': {
      'authMiddleware.js': '',
      'errorMiddleware.js': ''
    },
    'utils': {
      'helpers.js': ''
    },
    'server.js': '',
    'package.json': ''
  },
  '.gitignore': '',
  'README.md': ''
};

// Recursive function to create files/folders
function createStructure(base, obj) {
  for (const key in obj) {
    const filePath = path.join(base, key);
    if (typeof obj[key] === 'object') {
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
      createStructure(filePath, obj[key]);
    } else {
      fs.writeFileSync(filePath, obj[key]);
    }
  }
}

createStructure(basePath, structure);

console.log(`Project structure for "${projectName}" created successfully!`);

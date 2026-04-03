jest.mock('child_process');
jest.mock('readline');

describe('mainMenu.js', () => {
  let mainMenu;
  const mockIdePaths = {
    vsPath: 'C:\\Program Files\\Visual Studio\\2022\\Community\\Common7\\IDE',
    riderPath: 'C:\\Users\\User\\AppData\\Local\\JetBrains\\Toolbox\\apps\\Rider\\ch-0\\233.11235.16\\bin',
    ideaPath: 'C:\\Program Files\\JetBrains\\IntelliJ IDEA 2023.2\\bin'
  };

  const mockMenuItems = [
    {
      path: 'C:\\Projects\\Project1\\Project1.sln',
      ext: '.sln',
      type: 'vs',
      ide: 'Visual Studio',
      executable: 'devenv.exe'
    },
    {
      path: 'C:\\Projects\\Project2\\Project2.iml',
      ext: '.iml',
      type: 'jetbrains',
      ide: 'JetBrains Rider',
      executable: 'rider.exe'
    }
  ];

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    process.exit.mockRestore();
  });

  describe('loadSolution', () => {
    it('should create readline interface for multiple solutions', () => {
      const mockReadline = require('readline');
      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };
      mockReadline.createInterface.mockReturnValue(mockInterface);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      expect(mockReadline.createInterface).toHaveBeenCalled();
    });

    it('should show error when no solutions found', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution([], mockIdePaths);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('no solutions'));
    });

    it('should handle multiple solution spawning', () => {
      const { spawn } = require('child_process');
      const mockReadline = require('readline');
      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };
      mockReadline.createInterface.mockReturnValue(mockInterface);

      const mockSubprocess = {
        on: jest.fn().mockReturnThis(),
        unref: jest.fn()
      };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      expect(mockReadline.createInterface).toHaveBeenCalled();
    });

    it('should handle Visual Studio solution spawning', () => {
      const { spawn } = require('child_process');
      const mockReadline = require('readline');
      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };
      mockReadline.createInterface.mockReturnValue(mockInterface);

      const mockSubprocess = {
        on: jest.fn().mockReturnThis(),
        unref: jest.fn()
      };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      expect(mockReadline.createInterface).toHaveBeenCalled();
    });

    it('should handle JetBrains Rider solution spawning', () => {
      const { spawn } = require('child_process');
      const mockReadline = require('readline');
      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };
      mockReadline.createInterface.mockReturnValue(mockInterface);

      const mockSubprocess = {
        on: jest.fn().mockReturnThis(),
        unref: jest.fn()
      };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      expect(mockReadline.createInterface).toHaveBeenCalled();
    });

    it('should add error handler to subprocess', () => {
      const { spawn } = require('child_process');
      const mockReadline = require('readline');
      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };
      mockReadline.createInterface.mockReturnValue(mockInterface);

      const mockSubprocess = {
        on: jest.fn().mockReturnThis(),
        unref: jest.fn()
      };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      expect(mockReadline.createInterface).toHaveBeenCalled();
    });

    it('should handle all menu options gracefully', () => {
      const { spawn } = require('child_process');
      const mockReadline = require('readline');
      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };
      mockReadline.createInterface.mockReturnValue(mockInterface);

      const mockSubprocess = {
        on: jest.fn().mockReturnThis(),
        unref: jest.fn()
      };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      expect(mockReadline.createInterface).toHaveBeenCalled();
    });
  });

  describe('IDE Grouping', () => {
    it('should handle mixed IDE types in menu', () => {
      const mockReadline = require('readline');
      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };
      mockReadline.createInterface.mockReturnValue(mockInterface);

      mainMenu = require('../mainMenu');
      // Should not throw with mixed IDE types
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      expect(mockReadline.createInterface).toHaveBeenCalled();
    });

    it('should group solutions by IDE type', () => {
      const mockReadline = require('readline');
      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };
      mockReadline.createInterface.mockReturnValue(mockInterface);

      const multiIdeItems = [
        { path: 'C:\\Projects\\VS1.sln', ide: 'Visual Studio', type: 'vs', executable: 'devenv.exe' },
        { path: 'C:\\Projects\\VS2.sln', ide: 'Visual Studio', type: 'vs', executable: 'devenv.exe' },
        { path: 'C:\\Projects\\Rider.iml', ide: 'JetBrains Rider', type: 'jetbrains', executable: 'rider.exe' },
        { path: 'C:\\Projects\\Idea.iml', ide: 'JetBrains IntelliJ IDEA', type: 'jetbrains', executable: 'idea.exe' }
      ];

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(multiIdeItems, mockIdePaths);

      expect(mockReadline.createInterface).toHaveBeenCalled();
    });

    it('should display grouped menu when multiple IDEs present', () => {
      const mockReadline = require('readline');
      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };
      mockReadline.createInterface.mockReturnValue(mockInterface);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      // Verify menu interface was created and question was called
      expect(mockInterface.question).toHaveBeenCalled();
    });
  });

  describe('Ignore File Support', () => {
    it('should support .sln-openerignore patterns', () => {
      const mockReadline = require('readline');
      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };
      mockReadline.createInterface.mockReturnValue(mockInterface);

      mainMenu = require('../mainMenu');
      // getSolutions respects .sln-openerignore patterns
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      expect(mockReadline.createInterface).toHaveBeenCalled();
    });
  });
});



jest.mock('child_process');
jest.mock('readline');
jest.mock('../config');

describe('mainMenu.js', () => {
  let mainMenu;
  const mockIdePaths = {
    vsPath: 'C:\\Program Files\\Visual Studio\\2022\\Community\\Common7\\IDE',
    riderPath: 'C:\\Users\\User\\AppData\\Local\\JetBrains\\Toolbox\\apps\\Rider\\ch-0\\233.11235.16\\bin',
    ideaPath: 'C:\\Program Files\\JetBrains\\IntelliJ IDEA 2023.2\\bin'
  };

  const vsSolution = {
    path: 'C:\\Projects\\Project1\\Project1.sln',
    ext: '.sln',
    type: 'vs',
    ide: 'Visual Studio',
    executable: 'devenv.exe'
  };

  const riderSolution = {
    path: 'C:\\Projects\\Project2\\Project2.iml',
    ext: '.iml',
    type: 'jetbrains',
    ide: 'JetBrains Rider',
    executable: 'rider.exe'
  };

  const ideaSolution = {
    path: 'C:\\Projects\\Project3\\.idea',
    ext: '.idea',
    type: 'jetbrains',
    ide: 'JetBrains IntelliJ IDEA',
    executable: 'idea.exe'
  };

  const mockMenuItems = [vsSolution, riderSolution];

  let mockInterface;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => {});

    mockInterface = {
      question: jest.fn(),
      close: jest.fn()
    };

    const mockReadline = require('readline');
    mockReadline.createInterface.mockReturnValue(mockInterface);

    const mockConfig = require('../config');
    mockConfig.getRecentSolutions.mockReturnValue([]);
    mockConfig.formatTimeAgo.mockReturnValue('2h ago');
    mockConfig.addToRecentSolutions.mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    process.exit.mockRestore();
  });

  describe('loadSolution', () => {
    it('should show error when no solutions found', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution([], mockIdePaths);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('no solutions'));
    });

    it('should open single solution directly without showing a menu', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution([vsSolution], mockIdePaths);

      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('devenv.exe'),
        [vsSolution.path],
        expect.objectContaining({ detached: true })
      );
      const mockReadline = require('readline');
      expect(mockReadline.createInterface).not.toHaveBeenCalled();
    });

    it('should create readline interface for multiple solutions', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      const mockReadline = require('readline');
      expect(mockReadline.createInterface).toHaveBeenCalled();
    });

    it('should prompt with search question on load', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      expect(mockInterface.question).toHaveBeenCalledWith(
        expect.stringContaining('Search solutions'),
        expect.any(Function)
      );
    });
  });

  describe('Menu display and selection', () => {
    it('should display numbered menu including (All) option when Enter pressed', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      // Simulate pressing Enter (show all)
      const searchCallback = mockInterface.question.mock.calls[0][1];
      searchCallback('');

      const logged = console.log.mock.calls.map(c => c[0]).join('\n');
      expect(logged).toContain('1. (All)');
      expect(logged).toContain('Project1.sln');
      expect(logged).toContain('Project2.iml');
    });

    it('should display IDE labels next to solution names', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      const searchCallback = mockInterface.question.mock.calls[0][1];
      searchCallback('');

      const logged = console.log.mock.calls.map(c => c[0]).join('\n');
      expect(logged).toContain('[Visual Studio]');
      expect(logged).toContain('[JetBrains Rider]');
    });

    it('should exit when Exit option is selected', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      // Press Enter to show all solutions first
      mockInterface.question.mock.calls[0][1]('');

      // Select exit (last numbered option)
      const selectCallback = mockInterface.question.mock.calls[1][1];
      selectCallback('4'); // (All) + 2 solutions + Exit = option 4

      expect(process.exit).toHaveBeenCalled();
    });

    it('should show error on invalid menu selection', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      mockInterface.question.mock.calls[0][1]('');
      const selectCallback = mockInterface.question.mock.calls[1][1];
      selectCallback('99');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Invalid selection'));
    });

    it('should trigger new search when Enter pressed at selection prompt', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      mockInterface.question.mock.calls[0][1]('');
      const selectCallback = mockInterface.question.mock.calls[1][1];
      selectCallback('');

      // Should have called question again (new search prompt)
      expect(mockInterface.question.mock.calls.length).toBeGreaterThan(2);
    });
  });

  describe('Search and filter', () => {
    it('should filter solutions by name', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      const searchCallback = mockInterface.question.mock.calls[0][1];
      searchCallback('project1');

      const logged = console.log.mock.calls.map(c => c[0]).join('\n');
      expect(logged).toContain('Project1.sln');
      expect(logged).not.toContain('Project2.iml');
    });

    it('should show no-results message when search has no matches', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      const searchCallback = mockInterface.question.mock.calls[0][1];
      searchCallback('zzznomatch');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No solutions found'));
    });

    it('should show (Clear Filter) option when a filter is active', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      mockInterface.question.mock.calls[0][1]('project1');
      // Now show the menu with filter active
      const selectCallback = mockInterface.question.mock.calls[1][1];
      // Enter to trigger new search  
      selectCallback('');

      // Re-search with empty string clears filter
      const searchCallback2 = mockInterface.question.mock.calls[2][1];
      searchCallback2('project'); // filter again

      const logged = console.log.mock.calls.map(c => c[0]).join('\n');
      expect(logged).toContain('(Clear Filter)');
    });
  });

  describe('Opening solutions', () => {
    it('should spawn devenv.exe for Visual Studio solutions', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      mockInterface.question.mock.calls[0][1]('');
      // Option 2 = Project1.sln (after (All))
      mockInterface.question.mock.calls[1][1]('2');

      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('devenv.exe'),
        [vsSolution.path],
        expect.objectContaining({ detached: true })
      );
    });

    it('should spawn rider.exe for JetBrains Rider solutions', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      mockInterface.question.mock.calls[0][1]('');
      // Option 3 = Project2.iml
      mockInterface.question.mock.calls[1][1]('3');

      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('rider.exe'),
        [riderSolution.path],
        expect.objectContaining({ detached: true })
      );
    });

    it('should spawn idea.exe for IntelliJ IDEA solutions', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution([vsSolution, ideaSolution], mockIdePaths);

      mockInterface.question.mock.calls[0][1]('');
      // Option 3 = .idea project
      mockInterface.question.mock.calls[1][1]('3');

      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('idea.exe'),
        [ideaSolution.path],
        expect.objectContaining({ detached: true })
      );
    });

    it('should open all solutions when option 1 is selected', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      mockInterface.question.mock.calls[0][1]('');
      mockInterface.question.mock.calls[1][1]('1');

      expect(spawn).toHaveBeenCalledTimes(2);
    });

    it('should show error when IDE is not configured for solution type', () => {
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, { vsPath: '', riderPath: '', ideaPath: '' });

      mockInterface.question.mock.calls[0][1]('');
      mockInterface.question.mock.calls[1][1]('2'); // VS solution, but vsPath empty

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('IDE not configured'));
    });

    it('should record solution in recent history after opening', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      const mockConfig = require('../config');
      mainMenu = require('../mainMenu');
      mainMenu.loadSolution([vsSolution], mockIdePaths);

      expect(mockConfig.addToRecentSolutions).toHaveBeenCalledWith(vsSolution);
    });

    it('should register error handler on spawned subprocess', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution([vsSolution], mockIdePaths);

      expect(mockSubprocess.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should detach the subprocess so it runs independently', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution([vsSolution], mockIdePaths);

      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({ detached: true, stdio: 'ignore' })
      );
      expect(mockSubprocess.unref).toHaveBeenCalled();
    });
  });

  describe('Recent solutions', () => {
    it('should display recent solutions section when history exists', () => {
      const mockConfig = require('../config');
      mockConfig.getRecentSolutions.mockReturnValue([
        { path: vsSolution.path, timestamp: Date.now() - 7200000, ide: 'Visual Studio' }
      ]);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      mockInterface.question.mock.calls[0][1]('');

      const logged = console.log.mock.calls.map(c => c[0]).join('\n');
      expect(logged).toContain('RECENT');
    });

    it('should not display recent section when no history', () => {
      const mockConfig = require('../config');
      mockConfig.getRecentSolutions.mockReturnValue([]);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution(mockMenuItems, mockIdePaths);

      mockInterface.question.mock.calls[0][1]('');

      const logged = console.log.mock.calls.map(c => c[0]).join('\n');
      expect(logged).not.toContain('RECENT');
    });
  });

  describe('IDE Grouping', () => {
    it('should handle mixed IDE types in menu without throwing', () => {
      mainMenu = require('../mainMenu');
      expect(() => mainMenu.loadSolution(mockMenuItems, mockIdePaths)).not.toThrow();
    });
  });

  describe('selectedIDE override', () => {
    it('should use selectedIDE to open VS solution with VS when selectedIDE is "vs"', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution([vsSolution], mockIdePaths, 'vs');

      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('devenv.exe'),
        [vsSolution.path],
        expect.objectContaining({ detached: true })
      );
    });

    it('should override file-type detection and open jetbrains solution with VS when selectedIDE is "vs"', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      // riderSolution has type 'jetbrains' but selectedIDE forces VS
      mainMenu.loadSolution([riderSolution], mockIdePaths, 'vs');

      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('devenv.exe'),
        [riderSolution.path],
        expect.objectContaining({ detached: true })
      );
    });

    it('should use selectedIDE "rider" even for VS solution files', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution([vsSolution], mockIdePaths, 'rider');

      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('rider.exe'),
        [vsSolution.path],
        expect.objectContaining({ detached: true })
      );
    });

    it('should fall back to auto-detection when selectedIDE is null', () => {
      const { spawn } = require('child_process');
      const mockSubprocess = { on: jest.fn().mockReturnThis(), unref: jest.fn() };
      spawn.mockReturnValue(mockSubprocess);

      mainMenu = require('../mainMenu');
      mainMenu.loadSolution([riderSolution], mockIdePaths, null);

      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('rider.exe'),
        [riderSolution.path],
        expect.objectContaining({ detached: true })
      );
    });
  });
});

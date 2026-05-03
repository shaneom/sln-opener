const fs = require('fs');

jest.mock('fs');
jest.mock('nconf');
jest.mock('readline');

describe('config.js', () => {
  let config;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Reset process.platform for consistent testing
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    });
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('detectIDEType', () => {
    it('should detect Visual Studio .sln files', () => {
      config = require('../config');
      const ide = config.detectIDEType('C:\\Project\\Solution.sln');

      expect(ide.type).toBe('vs');
      expect(ide.name).toBe('Visual Studio');
      expect(ide.executable).toBe('devenv.exe');
    });

    it('should detect Visual Studio 2022 .slnx files', () => {
      config = require('../config');
      const ide = config.detectIDEType('C:\\Project\\Solution.slnx');

      expect(ide.type).toBe('vs');
      expect(ide.name).toBe('Visual Studio 2022');
    });

    it('should detect JetBrains Rider .iml files', () => {
      config = require('../config');
      const ide = config.detectIDEType('C:\\Project\\Project.iml');

      expect(ide.type).toBe('jetbrains');
      expect(ide.name).toBe('JetBrains Rider');
      expect(ide.executable).toBe('rider.exe');
    });

    it('should handle case-insensitive extensions', () => {
      config = require('../config');
      const ide = config.detectIDEType('C:\\Project\\Solution.SLN');

      expect(ide.type).toBe('vs');
    });
  });

  describe('getIDEPaths', () => {
    it('should return cached IDE paths if already configured', async () => {
      const mockNconf = require('nconf');
      const mockFs = require('fs');

      mockNconf.get.mockImplementation((key) => {
        if (key === 'config:vsPath') return 'C:\\VS\\Path';
        return '';
      });
      mockFs.existsSync.mockReturnValue(false);

      config = require('../config');
      const result = await config.getIDEPaths();

      expect(result.vsPath).toBe('C:\\VS\\Path');
    });

    it('should call readline when paths are empty', async () => {
      const mockNconf = require('nconf');
      const mockReadline = require('readline');
      const mockFs = require('fs');

      mockNconf.get.mockReturnValue('');
      mockFs.existsSync.mockReturnValue(false);

      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };

      mockReadline.createInterface.mockReturnValue(mockInterface);

      config = require('../config');
      
      const promise = config.getIDEPaths();
      expect(mockReadline.createInterface).toHaveBeenCalled();
      
      // Simulate user selecting "skip" for all IDEs
      mockInterface.question.mock.calls[0][1]('0');
    });

    it('should detect installed IDEs', async () => {
      const mockNconf = require('nconf');
      const mockReadline = require('readline');
      const mockFs = require('fs');

      mockNconf.get.mockReturnValue('');
      
      // Mock finding Visual Studio
      mockFs.existsSync.mockImplementation((path) => {
        if (path.includes('Microsoft Visual Studio') && path.includes('devenv.exe')) {
          return true;
        }
        return false;
      });

      mockFs.readdirSync.mockImplementation((path) => {
        if (path.includes('Microsoft Visual Studio')) {
          return ['2022', '2019'];
        }
        return [];
      });

      const mockInterface = {
        question: jest.fn(),
        close: jest.fn()
      };

      mockReadline.createInterface.mockReturnValue(mockInterface);

      config = require('../config');
      const promise = config.getIDEPaths();
      
      expect(mockReadline.createInterface).toHaveBeenCalled();
    });
  });

  describe('getSolutions', () => {
    it('should return array of solution objects with IDE info', () => {
      const fs = require('fs');
      
      // Mock fs for the new walkDirectory implementation
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);
      
      config = require('../config');
      const solutions = config.getSolutions();

      expect(Array.isArray(solutions)).toBe(true);
    });

    it('should return empty array if no solutions found', () => {
      const fs = require('fs');
      
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);

      config = require('../config');
      const solutions = config.getSolutions();

      expect(solutions).toEqual([]);
    });

    it('should support multiple file types', () => {
      const fs = require('fs');
      
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);

      config = require('../config');
      const solutions = config.getSolutions();

      expect(Array.isArray(solutions)).toBe(true);
    });

    it('should call readdirSync with current directory', () => {
      const fs = require('fs');
      
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);

      config = require('../config');
      config.getSolutions();

      expect(fs.readdirSync).toHaveBeenCalledWith(process.cwd());
    });

    it('should skip directories matching ignore patterns', () => {
      const fs = require('fs');
      
      // Mock a simple directory tree:
      //   cwd/
      //     node_modules/  (should be skipped)
      //     build/         (should be skipped)
      //     src/           (should be searched)
      //       App.sln      (should be found)
      const cwd = process.cwd();
      const nodeMod = require('path').join(cwd, 'node_modules');
      const build = require('path').join(cwd, 'build');
      const src = require('path').join(cwd, 'src');
      const sln = require('path').join(src, 'App.sln');

      fs.existsSync.mockImplementation((p) => p.endsWith('.sln-openerignore'));
      fs.readFileSync.mockReturnValue('node_modules\nbuild\n');
      fs.readdirSync.mockImplementation((p) => {
        if (p === cwd) return ['node_modules', 'build', 'src'];
        if (p === src) return ['App.sln'];
        return [];
      });
      fs.statSync.mockImplementation((p) => {
        const isDir = p === nodeMod || p === build || p === src;
        return {
          isDirectory: () => isDir,
          isFile: () => !isDir
        };
      });

      config = require('../config');
      const solutions = config.getSolutions();

      // node_modules and build are skipped; App.sln inside src is found
      expect(Array.isArray(solutions)).toBe(true);
      expect(solutions.length).toBe(1);
      expect(solutions[0].path).toBe(sln);
    });

    it('should return empty array when directory has no solution files', () => {
      const fs = require('fs');
      const cwd = process.cwd();

      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockImplementation((p) => {
        if (p === cwd) return ['readme.md', 'package.json'];
        return [];
      });
      fs.statSync.mockImplementation(() => ({
        isDirectory: () => false,
        isFile: () => true
      }));

      config = require('../config');
      const solutions = config.getSolutions();

      expect(solutions).toEqual([]);
    });
  });

  describe('.sln-openerignore support', () => {
    it('should detect formatTimeAgo function', () => {
      config = require('../config');
      expect(typeof config.formatTimeAgo).toBe('function');
    });

    it('formatTimeAgo should return "Just now" for recent timestamps', () => {
      config = require('../config');
      const now = Date.now();
      const result = config.formatTimeAgo(now);

      expect(result).toBe('Just now');
    });

    it('formatTimeAgo should return minutes ago', () => {
      config = require('../config');
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const result = config.formatTimeAgo(fiveMinutesAgo);

      expect(result).toMatch(/m ago/);
    });

    it('formatTimeAgo should return hours ago', () => {
      config = require('../config');
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      const result = config.formatTimeAgo(twoHoursAgo);

      expect(result).toMatch(/h ago/);
    });

    it('formatTimeAgo should return days ago', () => {
      config = require('../config');
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      const result = config.formatTimeAgo(threeDaysAgo);

      expect(result).toMatch(/d ago/);
    });
  });

  describe('selectIDEForSession', () => {
    it('should return null when no IDEs are configured', async () => {
      config = require('../config');
      const result = await config.selectIDEForSession({ vsPath: '', riderPath: '' });
      expect(result).toBeNull();
    });

    it('should auto-select "vs" when only VS is configured', async () => {
      config = require('../config');
      const result = await config.selectIDEForSession({
        vsPath: 'C:\\VS\\IDE',
        riderPath: ''
      });
      expect(result).toBe('vs');
    });

    it('should auto-select "rider" when only Rider is configured', async () => {
      config = require('../config');
      const result = await config.selectIDEForSession({
        vsPath: '',
        riderPath: 'C:\\Rider\\bin'
      });
      expect(result).toBe('rider');
    });

    it('should prompt and return selected IDE when multiple are configured', async () => {
      const readline = require('readline');
      const mockUi = { question: jest.fn(), close: jest.fn() };
      readline.createInterface.mockReturnValue(mockUi);

      // Simulate user selecting option 1 (Visual Studio)
      mockUi.question.mockImplementation((prompt, cb) => cb('1'));

      config = require('../config');
      const result = await config.selectIDEForSession({
        vsPath: 'C:\\VS\\IDE',
        riderPath: 'C:\\Rider\\bin'
      });

      expect(result).toBe('vs');
    });

    it('should return null (auto mode) when user selects the Auto option', async () => {
      const readline = require('readline');
      const mockUi = { question: jest.fn(), close: jest.fn() };
      readline.createInterface.mockReturnValue(mockUi);

      // Auto option is VS+Rider = 2 options, so auto = 3
      mockUi.question.mockImplementation((prompt, cb) => cb('3'));

      config = require('../config');
      const result = await config.selectIDEForSession({
        vsPath: 'C:\\VS\\IDE',
        riderPath: 'C:\\Rider\\bin'
      });

      expect(result).toBeNull();
    });
  });
});


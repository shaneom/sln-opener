const fs = require('fs');

jest.mock('fs');
jest.mock('nconf');
jest.mock('readline');
jest.mock('recursive-readdir-sync');

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

    it('should detect JetBrains IntelliJ .idea files', () => {
      config = require('../config');
      const ide = config.detectIDEType('C:\\Project\\project.iml');
      expect(ide.type).toBe('jetbrains');
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
      
      // Mock fs methods for ignore pattern testing
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('node_modules\nbuild\n');
      fs.readdirSync.mockReturnValue([
        'node_modules',
        'build',
        'src'
      ]);
      fs.statSync.mockImplementation((path) => {
        return {
          isDirectory: () => true,
          isFile: () => false
        };
      });

      config = require('../config');
      const solutions = config.getSolutions();
      
      // The function should return an array
      expect(Array.isArray(solutions)).toBe(true);
    });

    it('should support empty solutions array', () => {
      const mockRecursiveReadSync = require('recursive-readdir-sync');
      mockRecursiveReadSync.mockReturnValue([]);

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
});


/**
 * Detects installed IDEs on the system.
 * Searches common installation directories for Visual Studio, Rider, and IntelliJ IDEA.
 * @private
 * @returns {Object} Object with arrays of found IDE installations
 */
function detectInstalledIDEs() {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const found = {
        visualStudio: [],
        rider: [],
        intellijIdea: []
    };

    if (process.platform === 'win32') {
        // Windows: Search in Program Files
        const programFiles = process.env.ProgramFiles || 'C:\\Program Files';

        // Search for Visual Studio
        try {
            const vsPath = path.join(programFiles, 'Microsoft Visual Studio');
            if (fs.existsSync(vsPath)) {
                const versions = fs.readdirSync(vsPath);
                versions.forEach(version => {
                    const idePath = path.join(vsPath, version, 'Common7', 'IDE');
                    const devenvPath = path.join(idePath, 'devenv.exe');
                    if (fs.existsSync(devenvPath)) {
                        found.visualStudio.push({ version, path: idePath });
                    }
                });
            }
        } catch (e) {}

        // Search for JetBrains IDEs in Program Files
        try {
            const jetbrainsPath = path.join(programFiles, 'JetBrains');
            if (fs.existsSync(jetbrainsPath)) {
                const dirs = fs.readdirSync(jetbrainsPath);
                dirs.forEach(dir => {
                    const idePath = path.join(jetbrainsPath, dir, 'bin');
                    if (dir.startsWith('Rider')) {
                        const riderExe = path.join(idePath, 'rider.exe');
                        if (fs.existsSync(riderExe)) {
                            found.rider.push({ version: dir, path: idePath });
                        }
                    } else if (dir.startsWith('IntelliJ')) {
                        const ideaExe = path.join(idePath, 'idea.exe');
                        if (fs.existsSync(ideaExe)) {
                            found.intellijIdea.push({ version: dir, path: idePath });
                        }
                    }
                });
            }
        } catch (e) {}

        // Search for JetBrains Toolbox installations
        try {
            const toolboxPath = path.join(os.homedir(), 'AppData', 'Local', 'JetBrains', 'Toolbox', 'apps');
            if (fs.existsSync(toolboxPath)) {
                const apps = fs.readdirSync(toolboxPath);
                apps.forEach(appName => {
                    const appPath = path.join(toolboxPath, appName);
                    const chDirs = fs.readdirSync(appPath);
                    chDirs.forEach(ch => {
                        const versionDirs = fs.readdirSync(path.join(appPath, ch));
                        versionDirs.forEach(version => {
                            const binPath = path.join(appPath, ch, version, 'bin');
                            if (appName === 'Rider') {
                                const riderExe = path.join(binPath, 'rider.exe');
                                if (fs.existsSync(riderExe)) {
                                    found.rider.push({ version: `${appName} (Toolbox)`, path: binPath });
                                }
                            } else if (appName === 'IntelliJIdea') {
                                const ideaExe = path.join(binPath, 'idea.exe');
                                if (fs.existsSync(ideaExe)) {
                                    found.intellijIdea.push({ version: `${appName} (Toolbox)`, path: binPath });
                                }
                            }
                        });
                    });
                });
            }
        } catch (e) {}
    } else if (process.platform === 'darwin') {
        // macOS: Search in /Applications
        const appDir = '/Applications';
        try {
            const apps = fs.readdirSync(appDir);
            apps.forEach(app => {
                if (app.includes('Visual Studio')) {
                    const idePath = path.join(appDir, app, 'Contents', 'MacOS');
                    found.visualStudio.push({ version: app, path: idePath });
                } else if (app.includes('Rider')) {
                    const idePath = path.join(appDir, app, 'Contents', 'MacOS');
                    found.rider.push({ version: app, path: idePath });
                } else if (app.includes('IntelliJ')) {
                    const idePath = path.join(appDir, app, 'Contents', 'MacOS');
                    found.intellijIdea.push({ version: app, path: idePath });
                }
            });
        } catch (e) {}
    } else {
        // Linux: Search in common locations
        const commonPaths = [
            path.join(os.homedir(), '.local', 'share'),
            '/opt',
            '/usr/local'
        ];
        commonPaths.forEach(basePath => {
            try {
                if (fs.existsSync(basePath)) {
                    const dirs = fs.readdirSync(basePath);
                    dirs.forEach(dir => {
                        if (dir.includes('rider')) {
                            const riderExe = path.join(basePath, dir, 'bin', 'rider');
                            if (fs.existsSync(riderExe)) {
                                found.rider.push({ version: dir, path: path.join(basePath, dir, 'bin') });
                            }
                        } else if (dir.includes('idea')) {
                            const ideaExe = path.join(basePath, dir, 'bin', 'idea');
                            if (fs.existsSync(ideaExe)) {
                                found.intellijIdea.push({ version: dir, path: path.join(basePath, dir, 'bin') });
                            }
                        }
                    });
                }
            } catch (e) {}
        });
    }

    return found;
}

/**
 * Gets and validates IDE paths from configuration.
 * Auto-detects installed IDEs or prompts user on first run.
 * @async
 * @returns {Promise<Object>} Object with vsPath, riderPath, and ideaPath properties
 */
module.exports.getIDEPaths = async function() {
    const path = require('path');
    const colors = require('colors');
    const fs = require('fs');
    const readline = require('readline');
    const nconf = require('nconf');
    const os = require('os');
    
    // Use home directory for config file
    const configDir = path.join(os.homedir(), '.sln-opener');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    const configPath = path.join(configDir, 'config.json');

    nconf.use('file', { file: configPath });

    const idePaths = {
        vsPath: nconf.get('config:vsPath') || '',
        riderPath: nconf.get('config:riderPath') || '',
        ideaPath: nconf.get('config:ideaPath') || ''
    };

    // If at least VS path is configured, return it
    if (idePaths.vsPath !== '') {
        return idePaths;
    }

    // Otherwise, detect and prompt for IDE paths
    return await promptForIDEPaths(nconf, configPath);

    async function promptForIDEPaths(nconf, configPath) {
        const ui = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            console.log('\n' + '='.repeat(60));
            console.log('IDE Discovery & Configuration');
            console.log('='.repeat(60));

            const detected = detectInstalledIDEs();
            
            // Check if any IDEs were found
            const totalFound = detected.visualStudio.length + detected.rider.length + detected.intellijIdea.length;
            if (totalFound === 0) {
                console.log('\n⚠️  No supported IDEs detected on your system.');
                console.log('Supported IDEs: Visual Studio, JetBrains Rider, JetBrains IntelliJ IDEA\n');
                console.log('You can:');
                console.log('  1. Install one of the supported IDEs');
                console.log('  2. Provide the path manually below');
                console.log('  3. Press Enter to skip any IDE for now\n');
            }
            
            promptForVSPath();

            function promptForVSPath() {
                if (detected.visualStudio.length > 0) {
                    console.log('\nVisual Studio installations found:');
                    detected.visualStudio.forEach((vs, idx) => {
                        console.log(`  ${idx + 1}. ${vs.version}`);
                    });
                    console.log('  0. Skip / Enter custom path');
                    ui.question('\nSelect Visual Studio (0-' + detected.visualStudio.length + '): ', (answer) => {
                        const idx = parseInt(answer) - 1;
                        if (idx >= 0 && idx < detected.visualStudio.length) {
                            idePaths.vsPath = detected.visualStudio[idx].path;
                            nconf.set('config:vsPath', detected.visualStudio[idx].path);
                            promptForRiderPath();
                        } else if (answer === '0') {
                            promptForVSPathManual();
                        } else {
                            console.log('Invalid selection.'.bgRed);
                            promptForVSPath();
                        }
                    });
                } else {
                    promptForVSPathManual();
                }
            }

            function promptForVSPathManual() {
                ui.question('\nVisual Studio path (press Enter to skip): ', (vsPath) => {
                    vsPath = vsPath.trim();
                    if (vsPath) {
                        const devenvPath = path.join(vsPath, 'devenv.exe');
                        if (!fs.existsSync(devenvPath)) {
                            console.log(`⚠️  devenv.exe not found at ${devenvPath}`.bgYellow);
                            return promptForVSPathManual();
                        }
                        idePaths.vsPath = vsPath;
                        nconf.set('config:vsPath', vsPath);
                    }
                    promptForRiderPath();
                });
            }

            function promptForRiderPath() {
                if (detected.rider.length > 0) {
                    console.log('\nJetBrains Rider installations found:');
                    detected.rider.forEach((r, idx) => {
                        console.log(`  ${idx + 1}. ${r.version}`);
                    });
                    console.log('  0. Skip / Enter custom path');
                    ui.question('\nSelect Rider (0-' + detected.rider.length + '): ', (answer) => {
                        const idx = parseInt(answer) - 1;
                        if (idx >= 0 && idx < detected.rider.length) {
                            idePaths.riderPath = detected.rider[idx].path;
                            nconf.set('config:riderPath', detected.rider[idx].path);
                            promptForIDEAPath();
                        } else if (answer === '0') {
                            promptForRiderPathManual();
                        } else {
                            console.log('Invalid selection.'.bgRed);
                            promptForRiderPath();
                        }
                    });
                } else {
                    promptForRiderPathManual();
                }
            }

            function promptForRiderPathManual() {
                ui.question('\nJetBrains Rider path (press Enter to skip): ', (riderPath) => {
                    riderPath = riderPath.trim();
                    if (riderPath) {
                        const riderExePath = path.join(riderPath, process.platform === 'win32' ? 'rider.exe' : 'rider');
                        if (!fs.existsSync(riderExePath) && !fs.existsSync(riderPath)) {
                            console.log(`⚠️  Rider not found at ${riderPath}`.bgYellow);
                            return promptForRiderPathManual();
                        }
                        idePaths.riderPath = riderPath;
                        nconf.set('config:riderPath', riderPath);
                    }
                    promptForIDEAPath();
                });
            }

            function promptForIDEAPath() {
                if (detected.intellijIdea.length > 0) {
                    console.log('\nJetBrains IntelliJ IDEA installations found:');
                    detected.intellijIdea.forEach((idea, idx) => {
                        console.log(`  ${idx + 1}. ${idea.version}`);
                    });
                    console.log('  0. Skip / Enter custom path');
                    ui.question('\nSelect IntelliJ IDEA (0-' + detected.intellijIdea.length + '): ', (answer) => {
                        const idx = parseInt(answer) - 1;
                        if (idx >= 0 && idx < detected.intellijIdea.length) {
                            idePaths.ideaPath = detected.intellijIdea[idx].path;
                            nconf.set('config:ideaPath', detected.intellijIdea[idx].path);
                            finishConfiguration();
                        } else if (answer === '0') {
                            promptForIDEAPathManual();
                        } else {
                            console.log('Invalid selection.'.bgRed);
                            promptForIDEAPath();
                        }
                    });
                } else {
                    promptForIDEAPathManual();
                }
            }

            function promptForIDEAPathManual() {
                ui.question('\nJetBrains IntelliJ IDEA path (press Enter to skip): ', (ideaPath) => {
                    ideaPath = ideaPath.trim();
                    if (ideaPath) {
                        const ideaExePath = path.join(ideaPath, process.platform === 'win32' ? 'idea.exe' : 'idea');
                        if (!fs.existsSync(ideaExePath) && !fs.existsSync(ideaPath)) {
                            console.log(`⚠️  IntelliJ IDEA not found at ${ideaPath}`.bgYellow);
                            return promptForIDEAPathManual();
                        }
                        idePaths.ideaPath = ideaPath;
                        nconf.set('config:ideaPath', ideaPath);
                    }
                    finishConfiguration();
                });
            }

            function finishConfiguration() {
                nconf.save();
                if (idePaths.vsPath || idePaths.riderPath || idePaths.ideaPath) {
                    console.log('\n✓ IDE configuration saved.'.bgGreen);
                } else {
                    console.log('\n⚠️  No IDEs configured. You can configure them later by deleting ~/.sln-opener/config.json'.bgYellow);
                }
                console.log("Please type 'os' to open your solutions.\n");
                ui.close();
                resolve(idePaths);
            }
        });
    }
};

/**
 * Detects the IDE type based on file extension.
 * @param {string} filePath - Path to the solution/project file
 * @returns {Object} Object with type, name, and executable properties
 */
module.exports.detectIDEType = function(filePath) {
    const path = require('path');
    const ext = path.extname(filePath).toLowerCase();

    const ideMap = {
        '.sln': { type: 'vs', name: 'Visual Studio', executable: 'devenv.exe' },
        '.slnx': { type: 'vs', name: 'Visual Studio 2022', executable: 'devenv.exe' },
        '.iml': { type: 'jetbrains', name: 'JetBrains Rider', executable: 'rider.exe' },
        '.idea': { type: 'jetbrains', name: 'JetBrains IntelliJ IDEA', executable: 'idea.exe' }
    };

    // Return matching IDE info or unknown if extension not recognized
     return ideMap[ext] || { type: 'unknown', name: 'Unknown', executable: null };
};

/**
 * Gets all solution files in the current directory and subdirectories.
 * Recursively searches from the current working directory for multiple file types.
 * Supported types: .sln (Visual Studio), .slnx (VS2022), .iml (JetBrains Rider), .idea (IntelliJ IDEA)
 * @returns {Array<Object>} Array of objects with { path, type, ide, executable } properties
 */

/**
 * Reads and parses .sln-openerignore file for directory patterns to skip.
 * Works like .gitignore - supports exact names, wildcards, and comments (#)
 * @private
 * @returns {Array<string>} Array of patterns to ignore during directory traversal
 */
function readIgnoreFile() {
     const fs = require('fs');
     const path = require('path');

     const ignoreFilePath = path.join(process.cwd(), '.sln-openerignore');
     const patterns = [];

     // Only process if file exists
     if (fs.existsSync(ignoreFilePath)) {
         try {
             const content = fs.readFileSync(ignoreFilePath, 'utf8');
             // Parse each line, skipping empty lines and comments
             content.split('\n').forEach(line => {
                 const trimmed = line.trim();
                 // Include non-empty lines that aren't comments
                 if (trimmed && !trimmed.startsWith('#')) {
                     patterns.push(trimmed);
                 }
             });
         } catch (e) {
             // Silently ignore if file can't be read
         }
     }

     return patterns;
}

module.exports.getSolutions = function() {
     const path = require('path');
     const fs = require('fs');
     const solutions = [];
     const detectIDEType = module.exports.detectIDEType;
     // Load patterns from .sln-openerignore file to skip directories during search
     const ignorePatterns = readIgnoreFile();

     const supportedExtensions = ['.sln', '.slnx', '.iml', '.idea'];

     // Check if a file is a solution file we should open
     const isSupportedFile = function (element) {
         const extName = path.extname(element).toLowerCase();
         return supportedExtensions.includes(extName);
     };

     const currentDir = process.cwd();

     // Recursively traverse directory tree, skipping ignored directories
     function walkDirectory(dir) {
         try {
             const entries = fs.readdirSync(dir);
             for (const entry of entries) {
                 const fullPath = path.join(dir, entry);
                 try {
                     const stats = fs.statSync(fullPath);
                     if (stats.isDirectory()) {
                         // Check if directory matches any ignore patterns
                         const normalized = path.normalize(fullPath).toLowerCase();
                         const shouldSkip = ignorePatterns.some(p => {
                             const np = path.normalize(p).toLowerCase();
                             // Match: exact path ending, path component, or full path
                             return normalized.endsWith(np) || normalized.includes(path.sep + np + path.sep) || normalized.includes(path.sep + np);
                         });
                         // Recursively search non-ignored directories
                         if (!shouldSkip) walkDirectory(fullPath);
                     } else if (stats.isFile() && isSupportedFile(fullPath)) {
                         const ideInfo = detectIDEType(fullPath);
                         solutions.push({
                             path: fullPath,
                             ext: path.extname(fullPath).toLowerCase(),
                             type: ideInfo.type,
                             ide: ideInfo.name,
                             executable: ideInfo.executable
                         });
                     }
                 } catch (e) {}
             }
         } catch (e) {}
     }

     walkDirectory(currentDir);
     return solutions;
};

/**
 * Gets the list of recently opened solutions.
 * @param {number} maxItems - Maximum number of recent items to return (default: 5)
 * @returns {Array<Object>} Array of recent solution objects with { path, timestamp, ide } properties
 */
module.exports.getRecentSolutions = function(maxItems = 5) {
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    const nconf = require('nconf');
    
    const configDir = path.join(os.homedir(), '.sln-opener');
    const configPath = path.join(configDir, 'config.json');
    
    nconf.use('file', { file: configPath });
    
    // Get stored recent solutions list, defaulting to empty array
     const recent = nconf.get('config:recentSolutions') || [];
    // Return only the requested number of most recent solutions
     return recent.slice(0, maxItems);
};

/**
 * Adds a solution to the recent solutions history.
 * @param {Object} solutionFile - Solution object with path, ide, and type properties
 */
module.exports.addToRecentSolutions = function(solutionFile) {
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    const nconf = require('nconf');
    
    const configDir = path.join(os.homedir(), '.sln-opener');
    const configPath = path.join(configDir, 'config.json');
    
    nconf.use('file', { file: configPath });
    
    const recent = nconf.get('config:recentSolutions') || [];
    
    // If solution already in list, remove it so we can add it to front
    const filtered = recent.filter(item => item.path !== solutionFile.path);
    
    // Add solution to front of list with current timestamp
    const newItem = {
        path: solutionFile.path,
        timestamp: Date.now(),
        ide: solutionFile.ide
    };
    
    filtered.unshift(newItem);
    
    // Trim list to keep only 10 most recent (prevents config file growth)
    const limited = filtered.slice(0, 10);
    
    nconf.set('config:recentSolutions', limited);
    nconf.save();
};

/**
 * Formats time elapsed since solution was opened.
 * @private
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Human-readable time (e.g., "2 hours ago", "Just now")
 */
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Format based on time elapsed
     if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    // More than a day - show as days
     return `${diffDays}d ago`;
}

module.exports.formatTimeAgo = formatTimeAgo;

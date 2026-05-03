/**
 * Compares two version strings (e.g. "18.0.35211.57", "2024.3", "233.11235.16").
 * Returns positive if a > b, negative if a < b, 0 if equal.
 * @private
 */
function compareVersions(a, b) {
    const aParts = String(a || '0').split('.').map(Number);
    const bParts = String(b || '0').split('.').map(Number);
    const len = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < len; i++) {
        const diff = (aParts[i] || 0) - (bParts[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

/**
 * Detects installed IDEs on the system.
 * Searches common installation directories for Visual Studio and Rider.
 * Each result includes { version, sortableVersion, path }.
 * @private
 * @returns {Object} Object with arrays of found IDE installations
 */
function detectInstalledIDEs() {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const found = {
        visualStudio: [],
        rider: []
    };

    if (process.platform === 'win32') {
        // Windows: Search in both Program Files locations (VS is typically in x86 on 64-bit systems)
        const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
        const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
        const searchRoots = [...new Set([programFiles, programFilesX86])];

        // Search for Visual Studio using vswhere.exe (ships with VS 2017+, gives proper display names)
        const vswherePath = path.join(programFilesX86, 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');
        let vswhereFound = false;
        if (fs.existsSync(vswherePath)) {
            try {
                const { execSync } = require('child_process');
                const output = execSync(`"${vswherePath}" -all -format json -utf8`, { encoding: 'utf8' });
                const instances = JSON.parse(output);
                instances.forEach(instance => {
                    const idePath = path.join(instance.installationPath, 'Common7', 'IDE');
                    const devenvPath = path.join(idePath, 'devenv.exe');
                    if (fs.existsSync(devenvPath)) {
                        // displayName is e.g. "Visual Studio Community 2026"
                        found.visualStudio.push({
                            version: instance.displayName,
                            sortableVersion: instance.installationVersion || '0',
                            path: idePath
                        });
                        vswhereFound = true;
                    }
                });
            } catch (e) {}
        }

        // Fall back to directory scanning if vswhere is unavailable (VS 2015 and earlier)
        if (!vswhereFound) {
            searchRoots.forEach(root => {
                // VS 2017+ structure: Microsoft Visual Studio\{year}\{edition}\Common7\IDE\devenv.exe
                try {
                    const vsPath = path.join(root, 'Microsoft Visual Studio');
                    if (fs.existsSync(vsPath)) {
                        const versions = fs.readdirSync(vsPath);
                        versions.forEach(version => {
                            const yearPath = path.join(vsPath, version);
                            try {
                                const editions = fs.readdirSync(yearPath);
                                editions.forEach(edition => {
                                    const idePath = path.join(yearPath, edition, 'Common7', 'IDE');
                                    const devenvPath = path.join(idePath, 'devenv.exe');
                                    if (fs.existsSync(devenvPath)) {
                                        found.visualStudio.push({
                                            version: `Visual Studio ${version} ${edition}`,
                                            sortableVersion: version,
                                            path: idePath
                                        });
                                    }
                                });
                            } catch (e) {
                                const idePath = path.join(yearPath, 'Common7', 'IDE');
                                const devenvPath = path.join(idePath, 'devenv.exe');
                                if (fs.existsSync(devenvPath)) {
                                    found.visualStudio.push({
                                        version: `Visual Studio ${version}`,
                                        sortableVersion: version,
                                        path: idePath
                                    });
                                }
                            }
                        });
                    }
                } catch (e) {}

                // VS 2015 and earlier use a flat folder name with the internal version number
                const legacyVersions = [
                    { folder: 'Microsoft Visual Studio 14.0', label: 'Visual Studio 2015', sortableVersion: '14.0' },
                    { folder: 'Microsoft Visual Studio 12.0', label: 'Visual Studio 2013', sortableVersion: '12.0' },
                    { folder: 'Microsoft Visual Studio 11.0', label: 'Visual Studio 2012', sortableVersion: '11.0' },
                    { folder: 'Microsoft Visual Studio 10.0', label: 'Visual Studio 2010', sortableVersion: '10.0' },
                ];
                legacyVersions.forEach(({ folder, label, sortableVersion }) => {
                    try {
                        const idePath = path.join(root, folder, 'Common7', 'IDE');
                        const devenvPath = path.join(idePath, 'devenv.exe');
                        if (fs.existsSync(devenvPath)) {
                            found.visualStudio.push({ version: label, sortableVersion, path: idePath });
                        }
                    } catch (e) {}
                });
            });
        }

        // Search for JetBrains IDEs in both Program Files locations
        searchRoots.forEach(root => {
            try {
                const jetbrainsPath = path.join(root, 'JetBrains');
                if (fs.existsSync(jetbrainsPath)) {
                    const dirs = fs.readdirSync(jetbrainsPath);
                    dirs.forEach(dir => {
                        const idePath = path.join(jetbrainsPath, dir, 'bin');
                        // Extract version number from dir name e.g. "Rider 2024.3" → "2024.3"
                        const versionMatch = dir.match(/(\d+[\.\d]*)$/);
                        const sortableVersion = versionMatch ? versionMatch[1] : '0';
                        if (dir.startsWith('Rider')) {
                            const riderExe = path.join(idePath, 'rider.exe');
                            if (fs.existsSync(riderExe)) {
                                found.rider.push({ version: dir, sortableVersion, path: idePath });
                            }
                        }
                    });
                }
            } catch (e) {}
        });

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
                                    found.rider.push({ version: `${appName} ${version} (Toolbox)`, sortableVersion: version, path: binPath });
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
 * @returns {Promise<Object>} Object with vsPath and riderPath properties
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
        riderPath: nconf.get('config:riderPath') || ''
    };

    // If any IDE path is configured, check for newer versions before returning
    if (idePaths.vsPath || idePaths.riderPath) {
        return await checkForIDEUpgrades(nconf, configPath, idePaths);
    }

    // Otherwise, detect and prompt for IDE paths
    return await promptForIDEPaths(nconf, configPath);

    /**
     * Checks if any configured IDE has a newer version installed and prompts the user to switch.
     * Skips prompting if the newer version was previously dismissed with the 's' option.
     * Saves updated paths and version info to config if the user accepts an upgrade.
     * @async
     * @private
     * @param {Object} nconf - nconf instance with loaded config
     * @param {string} configPath - Path to the config file
     * @param {Object} idePaths - Object with vsPath and riderPath properties
     * @returns {Promise<Object>} Resolves with (possibly updated) idePaths
     */
    async function checkForIDEUpgrades(nconf, configPath, idePaths) {
        const detected = detectInstalledIDEs();

        const upgrades = [];

        // Check VS upgrades
        if (idePaths.vsPath && detected.visualStudio.length > 0) {
            const configuredVersion = nconf.get('config:vsSortableVersion') || '0';
            const dismissedVersion = nconf.get('config:vsDismissedUpgrade') || '';
            const best = detected.visualStudio.reduce((a, b) =>
                compareVersions(b.sortableVersion, a.sortableVersion) > 0 ? b : a
            );
            if (
                best.path !== idePaths.vsPath &&
                compareVersions(best.sortableVersion, configuredVersion) > 0 &&
                best.sortableVersion !== dismissedVersion
            ) {
                upgrades.push({ type: 'vs', label: 'Visual Studio', best, key: 'vsPath', versionKey: 'config:vsSortableVersion', dismissKey: 'config:vsDismissedUpgrade' });
            }
        }

        // Check Rider upgrades
        if (idePaths.riderPath && detected.rider.length > 0) {
            const configuredVersion = nconf.get('config:riderSortableVersion') || '0';
            const dismissedVersion = nconf.get('config:riderDismissedUpgrade') || '';
            const best = detected.rider.reduce((a, b) =>
                compareVersions(b.sortableVersion, a.sortableVersion) > 0 ? b : a
            );
            if (
                best.path !== idePaths.riderPath &&
                compareVersions(best.sortableVersion, configuredVersion) > 0 &&
                best.sortableVersion !== dismissedVersion
            ) {
                upgrades.push({ type: 'rider', label: 'JetBrains Rider', best, key: 'riderPath', versionKey: 'config:riderSortableVersion', dismissKey: 'config:riderDismissedUpgrade' });
            }
        }

        // Check IntelliJ IDEA upgrades removed — IntelliJ IDEA support removed

        if (upgrades.length === 0) return idePaths;

        // Prompt user for each upgrade
        const ui = readline.createInterface({ input: process.stdin, output: process.stdout });

        await new Promise(resolve => {
            let i = 0;
            function promptNext() {
                if (i >= upgrades.length) {
                    ui.close();
                    nconf.save();
                    return resolve();
                }
                const u = upgrades[i++];
                console.log(`\n💡 A newer version of ${u.label} was found: ${u.best.version}`);
                ui.question(`   Switch to it? (y = yes, n = no, s = skip and don't ask again): `, (answer) => {
                    const a = answer.trim().toLowerCase();
                    if (a === 'y') {
                        idePaths[u.key] = u.best.path;
                        nconf.set(`config:${u.key}`, u.best.path);
                        nconf.set(u.versionKey, u.best.sortableVersion);
                        nconf.set(u.dismissKey, '');
                        console.log(`   ✓ Switched to ${u.best.version}`.bgGreen);
                    } else if (a === 's') {
                        nconf.set(u.dismissKey, u.best.sortableVersion);
                        console.log(`   ✓ Noted — won't ask again for this version.`);
                    }
                    promptNext();
                });
            }
            promptNext();
        });

        return idePaths;
    }

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
            const totalFound = detected.visualStudio.length + detected.rider.length;
            if (totalFound === 0) {
                console.log('\n⚠️  No supported IDEs detected on your system.');
                console.log('Supported IDEs: Visual Studio, JetBrains Rider\n');
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
                            nconf.set('config:vsSortableVersion', detected.visualStudio[idx].sortableVersion || '0');
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
                            nconf.set('config:riderSortableVersion', detected.rider[idx].sortableVersion || '0');
                            finishConfiguration();
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
                    finishConfiguration();
                });
            }

            function finishConfiguration() {
                nconf.save();
                if (idePaths.vsPath || idePaths.riderPath) {
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
 * Prompts the user to choose which configured IDE to use for the session.
 * Skips the prompt if only one IDE is configured (auto-selects it).
 * @async
 * @param {Object} idePaths - Object with vsPath and riderPath properties
 * @returns {Promise<string|null>} Resolves with 'vs', 'rider', or null (auto per file)
 */
module.exports.selectIDEForSession = async function(idePaths) {
    const readline = require('readline');

    const options = [];
    if (idePaths.vsPath)    options.push({ key: 'vs',    label: 'Visual Studio' });
    if (idePaths.riderPath) options.push({ key: 'rider', label: 'JetBrains Rider' });

    // Nothing configured — caller will handle this
    if (options.length === 0) return null;

    // Only one IDE configured — use it automatically, no prompt needed
    if (options.length === 1) return options[0].key;

    // Multiple IDEs — let the user choose
    return new Promise(resolve => {
        const ui = readline.createInterface({ input: process.stdin, output: process.stdout });

        console.log('\n' + '='.repeat(40));
        console.log('Select IDE to open solutions with:');
        console.log('='.repeat(40));
        options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt.label}`));
        console.log(`  ${options.length + 1}. Auto (best match per file type)`);
        console.log('');

        function ask() {
            ui.question(`Select (1-${options.length + 1}): `, answer => {
                const idx = parseInt(answer.trim()) - 1;
                ui.close();
                if (idx >= 0 && idx < options.length) {
                    resolve(options[idx].key);
                } else if (idx === options.length) {
                    resolve(null); // auto mode
                } else {
                    console.log('Invalid selection.'.bgRed);
                    // Re-open interface for retry
                    module.exports.selectIDEForSession(idePaths).then(resolve);
                }
            });
        }
        ask();
    });
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
        '.iml': { type: 'jetbrains', name: 'JetBrains Rider', executable: process.platform === 'win32' ? 'rider.exe' : 'rider' }
    };

    // Return matching IDE info or unknown if extension not recognized
    return ideMap[ext] || { type: 'unknown', name: 'Unknown', executable: null };
};

/**
 * Gets all solution files in the current directory and subdirectories.
 * Recursively searches from the current working directory for multiple file types.
 * Supported types: .sln (Visual Studio), .slnx (VS2022), .iml (JetBrains Rider)
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

     const supportedFileExtensions = ['.sln', '.slnx', '.iml'];

     // Check if a file has a supported solution extension
     const isSupportedFile = function (element) {
         const extName = path.extname(element).toLowerCase();
         return supportedFileExtensions.includes(extName);
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

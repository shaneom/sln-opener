/**
 * Displays a menu to select and launch a Visual Studio solution or JetBrains project.
 * If only one solution is found, launches it directly.
 * If multiple solutions are found, displays a numbered menu with options to:
 * - View recently opened solutions first (last 5)
 * - Search/filter solutions by name
 * - Open all solutions (option 1)
 * - Open a specific solution
 * - Exit
 * @param {Array<Object>} menuItems - Array of solution/project objects with path, ide, and executable properties
 * @param {Object} idePaths - Object with vsPath and riderPath properties
 * @param {string|null} selectedIDE - 'vs', 'rider', or null for auto-detection per file type
 */
module.exports.loadSolution = function(menuItems, idePaths, selectedIDE = null) {
    const readline = require('readline');
    const path = require('path');
    const colors = require('colors');
    const config = require('./config');
    let menu = null;
    let currentFilter = '';

    if (menuItems.length > 0) {
        if (menuItems.length === 1) {
            spanSolution(menuItems[0]);
        } else {
            showMenu(menuItems);
        }
    } else {
        console.log('There are no solutions to open.'.bgRed);
    }

    function showMenu(allItems) {
        menu = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        promptSearch(allItems);
    }

    function promptSearch(allItems) {
        const searchPrompt = currentFilter ? `Search (or Enter to show all) [${currentFilter}]: ` : 'Search solutions (or press Enter to show all): ';
        
        menu.question('\n' + searchPrompt, function(input) {
            input = input.trim().toLowerCase();
            
            if (input === '') {
                // Show all
                currentFilter = '';
                displayMenu(allItems, allItems, true);
            } else {
                // Filter
                currentFilter = input;
                const filtered = allItems.filter(item => {
                    const basename = path.basename(item.path).toLowerCase();
                    const dirname = path.dirname(item.path).toLowerCase();
                    // Match solutions where file name OR directory path contains search term
                     return basename.includes(input) || dirname.includes(input);
                });
                
                if (filtered.length === 0) {
                    console.log(`No solutions found matching "${input}".`.bgYellow);
                    promptSearch(allItems);
                } else {
                    displayMenu(filtered, allItems, false);
                }
            }
        });
    }

    function displayMenu(filteredItems, allItems, showRecent) {
        console.log('\n');
        
        const recentSolutions = showRecent ? config.getRecentSolutions(5) : [];
        
        // Add (All) and (Clear Filter) options
        const displayItems = ['(All)'];
        if (currentFilter) {
            displayItems.push('(Clear Filter)');
        }
        
        // Collect recent solutions that exist in the current directory scan
        let recentDisplayItems = [];
        if (showRecent && recentSolutions.length > 0) {
            recentSolutions.forEach(recent => {
                const solutionItem = allItems.find(item => item.path === recent.path);
                if (solutionItem) {
                    recentDisplayItems.push({ item: solutionItem, timeAgo: config.formatTimeAgo(recent.timestamp) });
                }
            });
        }
        
        // Add filtered solutions (skip those already in recent so they don't appear twice)
        filteredItems.forEach(item => {
            if (!recentDisplayItems.find(r => r.item.path === item.path)) {
                displayItems.push(item);
            }
        });
        
        // Display menu - number every selectable item including recent ones
        let displayIndex = 1;

        // Print recent section header first (items will appear as numbered options)
        if (recentDisplayItems.length > 0) {
            console.log('⏱️  RECENT (Last 5 opened):');
        }

        // Print all items with numbers so users know exactly what to type
        for (let i = 0; i < displayItems.length; i++) {
            const item = displayItems[i];
            if (typeof item === 'string') {
                console.log(displayIndex + '. ' + item);
                displayIndex++;
            } else {
                const ideLabel = item.ide ? ` [${item.ide}]` : '';
                console.log(displayIndex + '. ' + path.basename(item.path) + ideLabel);
                displayIndex++;
            }
        }

        // Print recent items as numbered options after the main list
        if (recentDisplayItems.length > 0) {
            console.log('');
            recentDisplayItems.forEach(({ item, timeAgo }) => {
                const ideLabel = item.ide ? ` [${item.ide}]` : '';
                console.log(displayIndex + '. ' + path.basename(item.path) + ideLabel + ' - ' + timeAgo);
                displayIndex++;
            });
            console.log('');
        }

        // Show filter context
        if (currentFilter) {
            console.log(`📁 Results for "${currentFilter}" (${filteredItems.length} of ${allItems.length})`);
            console.log('');
        }

        // Exit/New Search is always the last numbered option
        const allSelectableItems = displayItems.concat(recentDisplayItems.map(r => r.item));
        console.log(allSelectableItems.length + 1 + '. ' + (currentFilter ? 'New Search' : 'Exit'));
        
        createMenu(displayItems, filteredItems, allItems, recentDisplayItems.map(r => r.item));
    }

    function createMenu(displayItems, filteredItems, allItems, recentDisplayItems) {
        menu.question('\nSelect solution (or press Enter for new search): ', function(input) {
            input = input.trim();
            
            if (input === '') {
                // New search
                promptSearch(allItems);
                return;
            }
            
            const menuOption = parseInt(input);
            const totalItems = displayItems.length + recentDisplayItems.length;

            if (isNaN(menuOption) || menuOption < 1 || menuOption > totalItems + 1) {
                console.log('Invalid selection. Please try again.'.bgRed);
                displayMenu(filteredItems, allItems, currentFilter === '');
                return;
            }

            if (menuOption === totalItems + 1) {
                if (menu) menu.close();
                process.exit();
            }

            openSolution(menuOption, displayItems, filteredItems, allItems, recentDisplayItems);
            if (menu) menu.close();
        });
    }

    function openSolution(menuOption, displayItems, filteredItems, allItems, recentDisplayItems) {
        // Combine all displayable items (menu options + recent solutions)
        const allDisplayItems = displayItems.concat(recentDisplayItems);
        
        if (menuOption === 1) {
            // Open all
            filteredItems.forEach((item) => {
                spanSolution(item);
            });
        } else if (displayItems[menuOption - 1] === '(Clear Filter)') {
            // Clear filter and show menu again
            currentFilter = '';
            if (menu) menu.close();
            showMenu(allItems);
        } else {
            // Open selected
            const selectedItem = allDisplayItems[menuOption - 1];
            spanSolution(selectedItem);
        }
    }

    function spanSolution(solutionFile) {
        const { spawn } = require('child_process');

        if (!solutionFile || typeof solutionFile === 'string') {
            console.log('Error: Invalid solution selection.'.bgRed);
            return;
        }

        // Record this solution as recently opened for quick access next time
        config.addToRecentSolutions(solutionFile);

        // Use the session IDE selection if set, otherwise auto-detect by file type
        const ideType = selectedIDE || solutionFile.type;
        let ideExePath = '';

        if (ideType === 'vs') {
            if (idePaths.vsPath) {
                ideExePath = path.join(idePaths.vsPath, 'devenv.exe');
            }
        } else if (ideType === 'rider' || (ideType === 'jetbrains' && solutionFile.executable === 'rider.exe')) {
            if (idePaths.riderPath) {
                ideExePath = path.join(idePaths.riderPath, 'rider.exe');
            }
        }

        if (!ideExePath) {
            console.log(`Error: IDE not configured for ${solutionFile.ide}`.bgRed);
            return;
        }

        const subprocess = spawn(ideExePath, [solutionFile.path], {
            detached: true,
            stdio: 'ignore'
        });

        if (subprocess) {
            subprocess.on('error', (error) => {
                console.log(`Error opening solution: ${error.message}`.bgRed);
            });

            subprocess.unref();
        }
    }
};
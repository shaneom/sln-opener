#!/usr/bin/env node
// sln-opener CLI - Opens Visual Studio and JetBrains solutions from command line
const isAdmin = require('is-admin').default;
const colors = require('colors');
const config = require('./config');
const menu = require('./mainMenu');
const packageJson = require('./package.json');
const args = process.argv.slice(2);

// Handle --version flag to show installed version
if (args.includes('--version') || args.includes('-v')) {
    console.log(`sln-opener v${packageJson.version}`);
    process.exit(0);
}

// Handle --help flag to show usage information
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
sln-opener v${packageJson.version} - Open Visual Studio solutions and JetBrains projects from the command line

Usage:
  os [options]

Options:
  --version, -v    Show version number
  --help, -h       Show this help message

Supported File Types:
  .sln             Visual Studio solution
  .slnx            Visual Studio 2022 solution
  .iml             JetBrains Rider project
  .idea            JetBrains IntelliJ IDEA project

Examples:
  os                  Opens a menu to select and open solutions in the current directory
  os --version        Shows the installed version
  os --help           Shows this help message

For more information, visit: https://github.com/shaneom/sln-opener
    `.trim());
    process.exit(0);
}

// Verify user has administrator privileges (required to launch IDEs)
isAdmin().then(admin => {
    if (admin) {
        startUp();
    } else {
        console.log('You need elevated permission to run this tool.  Please reload your CLI with administrative access.'.bgRed);
    }
});

// Main entry point - get IDE paths and discover solutions
async function startUp() {
    // Get or configure IDE paths (prompts user on first run)
    const idePaths = await config.getIDEPaths();

    // If at least one IDE is configured, proceed to solution discovery
    if (idePaths.vsPath || idePaths.riderPath || idePaths.ideaPath) {
        // Let user choose which IDE to use (auto-skipped when only one is configured)
        const selectedIDE = await config.selectIDEForSession(idePaths);
        // Discover all solution files in current directory and subdirectories
        const solutions = config.getSolutions();
        // Show menu to let user select which solution to open
        menu.loadSolution(solutions, idePaths, selectedIDE);
    }
}
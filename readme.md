# sln-opener

[![npm version](https://badge.fury.io/js/sln-opener.svg)](https://badge.fury.io/js/sln-opener)

A command line tool for opening Visual Studio solutions and JetBrains projects directly from the terminal. Supports multiple IDEs and project file types. Useful when you work from the command line using tools like Git Bash or PowerShell.

## Features

- 🔍 **Multi-IDE Support**: Opens Visual Studio solutions (.sln/.slnx) and JetBrains projects (.iml)
- 🔄 **Recursive Search**: Automatically finds all supported project files in the current directory and subdirectories
- 📋 **Interactive Menu**: When multiple projects are found, presents a numbered menu with IDE indicators
- 📦 **IDE Grouping**: Solutions organized by IDE type for easier navigation
- ⏱️ **Recent Solutions**: Quickly access recently opened projects with timestamps
- 🔎 **Search & Filter**: Filter results by project name or directory path
- 🚀 **Batch Open**: Open all projects at once with a single menu option
- ⚙️ **IDE Configuration**: Stores paths to Visual Studio, JetBrains Rider, and IntelliJ IDEA
- ⏩ **Performance**: Skip large directories (node_modules, .git, build, dist) with .sln-openerignore
- 🛡️ **Safe**: Validates paths and handles errors gracefully

## Supported File Types

| File Type | IDE | Required |
|-----------|-----|----------|
| `.sln` | Visual Studio | ✓ (at least one) |
| `.slnx` | Visual Studio 2022 | Optional |
| `.iml` | JetBrains Rider | Optional |
| `.iml` | JetBrains IntelliJ IDEA | Optional |

## Requirements

- **Windows OS** (requires IDE executables)
- **At least one IDE installed**:
  - Visual Studio (2015 or later) with devenv.exe
  - JetBrains Rider with rider.exe
  - JetBrains IntelliJ IDEA with idea.exe
- **Node.js** and npm
- **Administrator privileges** (to launch IDEs)

## Installation

```bash
npm install -g sln-opener
```

## Usage

Navigate to a directory containing solution or project files and type:

```bash
os
```

The tool will:
1. Check for IDE installation paths (prompts you on first run)
2. Search the current directory recursively for supported project files
3. Display results:
   - **Single project**: Opens it automatically with the appropriate IDE
   - **Multiple projects**: Shows a menu to select which to open
   - **No projects**: Displays an error message

### Menu Options

When multiple projects are found:

```
⏱️  RECENT (Last 5 opened):
  • MyProject.sln [Visual Studio] - 2h ago

📁 Results for "" (15 solutions):

1. (All)                                    - Opens all projects found
2. MyProject.sln

📦 Visual Studio:
3. WebApp.sln
4. Backend.sln

📦 JetBrains Rider:
5. MobileApp.iml
6. LibraryProject.iml

7. Exit                                     - Closes menu without opening
```

### Search & Filter

Filter results by project name or directory:

```
Search solutions (or press Enter to show all): web
📁 Results for "web" (2 of 15):

1. (All)
2. (Clear Filter)
3. WebApp.sln [Visual Studio]
4. web-lib.iml [JetBrains Rider]
5. New Search
```

### IDE Grouping

Solutions are automatically organized by IDE type for better navigation:
- **Visual Studio** (.sln, .slnx files)
- **JetBrains Rider** (.iml files for C# projects)
- **JetBrains IntelliJ IDEA** (.iml files for Java projects)

### Examples

**Example 1: Single solution**
```
$ os
Opening C:\Projects\MyProject\MyProject.sln...
```

**Example 2: Mixed projects**
```
$ os
1. (All)
2. MyProject.sln [Visual Studio]
3. RiderProject.iml [JetBrains Rider]
4. IdeaProject.iml [JetBrains IntelliJ IDEA]
5. Exit

Select the solution to open? 3
Opening C:\Projects\RiderProject\RiderProject.iml with JetBrains Rider...
```

## Performance Optimization with .sln-openerignore

For large project repositories with many subdirectories, solution discovery can be slow. Use `.sln-openerignore` to skip directories during the search.

### Creating a .sln-openerignore File

Create a `.sln-openerignore` file in your project root directory with patterns for directories to skip:

```
# .sln-openerignore - Directories to skip during solution discovery

# Package managers
node_modules
packages
.nuget

# Build outputs
bin
obj
build
dist

# Version control
.git
.svn

# IDE files
.vs
.vscode
.idea
```

### Performance Impact

Without ignore patterns: ~15-30 seconds on large repos
With ignore patterns: ~1-3 seconds (skipping node_modules, .git, build, dist, etc.)

### Supported Patterns

- Exact directory names: `node_modules`, `.git`, `bin`
- Wildcard patterns: `build/*`, `dist/*`
- Comments: Lines starting with `#`

The tool automatically skips empty lines and comments.

## Configuration

The tool stores your IDE paths in a configuration file the first time you run it. You will be prompted to enter the paths to your IDE installations.

### IDE Paths to Configure

On first run, you can configure paths to:
- **Visual Studio**: Path to the directory containing devenv.exe
- **JetBrains Rider**: Path to the Rider installation directory
- **JetBrains IntelliJ IDEA**: Path to the IntelliJ IDEA installation directory

**Example valid paths:**
- VS: `C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE`
- Rider: `C:\Users\User\AppData\Local\JetBrains\Toolbox\apps\Rider\ch-0\233.11235.16\bin`
- IntelliJ: `C:\Program Files\JetBrains\IntelliJ IDEA 2023.2\bin`

Configuration is typically stored in: `%APPDATA%\npm\node_modules\sln-opener\config.json`

## Troubleshooting

### "You need elevated permission to run this tool"
- The CLI must be run with **Administrator privileges**
- On Windows, launch your terminal (PowerShell, Command Prompt, Git Bash) as Administrator
- Right-click the terminal app → "Run as administrator"

### "The [IDE] executable does not exist"
- The path you entered is incorrect or the IDE is not installed
- Verify your IDE installation path is correct
- Try running the tool again - it will prompt you to re-enter paths
- Configuration file location: `%APPDATA%\npm\node_modules\sln-opener\config.json`

### "There are no solutions to open"
- No supported project files were found in the current directory or subdirectories
- Navigate to a directory with Visual Studio solutions or JetBrains projects
- Verify the directory structure includes .sln, .slnx, or .iml files

### "Error: IDE not configured for [IDE name]"
- The IDE type is detected but the path is not configured
- Run the tool again and provide the path to the IDE when prompted

### Invalid selection / Tool closes unexpectedly
- Enter a valid menu number from the displayed options
- Make sure your terminal is running with administrator privileges
- Check that your IDEs are properly installed and accessible

## Development

### Setup

```bash
git clone https://github.com/shaneom/sln-opener.git
cd sln-opener
npm install
```

### Running Tests

```bash
npm test              # Run all tests once
npm run test:watch   # Run tests in watch mode
```

### Testing During Development

For local testing without global installation:

```bash
node index.js
```

## How It Works

1. **Permission Check**: Verifies the CLI is running with administrator privileges
2. **IDE Configuration**: Reads or creates IDE path configuration
3. **Discovery**: Recursively scans the current directory for supported file types
4. **IDE Detection**: Maps file types to their corresponding IDEs
5. **Selection**: Shows a menu if multiple projects exist
6. **Launch**: Spawns the appropriate IDE with the selected project file

## CLI Flags

```
os --help       Show usage information
os --version    Show installed version
os              Open projects in current directory (default)
```

## Version History

- **v0.3.0** - Multi-IDE support (Visual Studio, JetBrains Rider, IntelliJ IDEA)
- **v0.2.1** - Improved error handling and cross-platform support
- **v0.2.0** - Added batch open functionality
- **v0.1.0** - Initial release (Visual Studio only)

## License

MIT

## Author

Shane O'Mahoney

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Support

For issues or questions, please visit: https://github.com/shaneom/sln-opener/issues


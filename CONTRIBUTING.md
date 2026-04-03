# Contributing to sln-opener

Thank you for considering contributing to sln-opener! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions with maintainers and other contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sln-opener.git
   cd sln-opener
   ```
3. **Add upstream remote** to sync with main repo:
   ```bash
   git remote add upstream https://github.com/shaneom/sln-opener.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Code Quality

- **Linting**: Tests are run with ESLint to catch style issues
- **Tests**: All new code must include tests
- **Coverage**: Aim for >80% code coverage on changed files

### Testing Locally

```bash
# Run the tool locally without installing globally
node index.js

# Run with Node inspector for debugging
node --inspect index.js
```

## Making Changes

### Code Style

- Use `const` for constants and required modules
- Use `let` for variables
- Use arrow functions where appropriate
- Add JSDoc comments for public functions
- Keep functions focused and small
- Follow the existing code structure in the project

### Commit Messages

Write clear, descriptive commit messages:

```
Fix: Correct menu exit behavior

- Fixed issue where exit option wasn't being recognized
- Added input validation for menu selections
- Improved error messages for invalid inputs
```

Guidelines:
- Start with an action word (Add, Fix, Improve, Refactor, Docs, Test)
- Be concise but descriptive
- Include the why, not just the what
- Keep commits focused on a single concern

### Pull Request Process

1. **Sync your fork** with upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** with:
   - Clear title describing the change
   - Description of what changed and why
   - Reference to any related issues (#123)
   - Evidence of testing (test output or screenshots)

4. **Address review feedback**:
   - Keep commits clean and logical
   - Push updates to the same branch
   - Respond to comments and suggestions

## Types of Contributions

### Bug Reports

Found a bug? Create an issue with:
- Clear reproduction steps
- Expected vs actual behavior
- Your environment (OS, Node version, VS version)
- Error messages or logs

### Feature Requests

Have an idea? Create an issue describing:
- The feature and its use case
- How it would improve the tool
- Potential implementation approach (optional)

### Documentation

Improvements to README, comments, or examples are always welcome:
- Fix typos or unclear explanations
- Add examples or use cases
- Improve troubleshooting guides
- Document new features

### Code Improvements

- Refactoring for clarity and maintainability
- Performance improvements
- Better error handling
- Test coverage improvements

## Areas for Contribution

### High Priority

- [ ] Cross-platform support (macOS, Linux)
- [ ] Support for other IDEs (VS Code, JetBrains, etc.)
- [ ] Improved configuration management
- [ ] Better logging and debugging

### Nice to Have

- [ ] Configuration options (colors, output format)
- [ ] Solution file filtering by name pattern
- [ ] Recent solutions history
- [ ] TypeScript migration

## Setting Up for Testing

The project uses Jest for unit testing. Key test files:

- `__tests__/config.test.js` - Tests for config module
- `__tests__/mainMenu.test.js` - Tests for menu module

When adding new functionality:

1. Write tests first (TDD approach) or alongside code
2. Use mocks to isolate units being tested
3. Test both success and failure cases
4. Aim for >80% coverage

## Debugging

### Using Node Inspector

```bash
node --inspect index.js
# Visit chrome://inspect in Chrome Developer Tools
```

### Adding Debug Output

```javascript
// Use console.log for debugging
console.log('Debug info:', variable);

// Or use a debugging library
const debug = require('debug')('sln-opener');
debug('Detailed message');
```

## Questions or Need Help?

- **Documentation**: Check the README.md and existing code comments
- **Issues**: Search existing issues for similar problems
- **Discussions**: Create a GitHub discussion for questions

## Recognition

Contributors will be recognized in:
- The project README
- Release notes for relevant versions
- GitHub contributors page

## License

By contributing, you agree that your contributions will be licensed under the MIT License (same as the project).

Thank you for contributing to sln-opener! 🎉

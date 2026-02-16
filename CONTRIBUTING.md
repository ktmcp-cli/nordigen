# Contributing to Nordigen CLI

Thank you for your interest in contributing to the Nordigen CLI!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/ktmcp/nordigen-cli.git
cd nordigen-cli

# Install dependencies
npm install

# Make the CLI executable
chmod +x bin/nordigen.js

# Link for local development
npm link
```

## Project Structure

```
nordigen-cli/
├── bin/
│   └── nordigen.js          # Main CLI entry point
├── src/
│   ├── commands/            # Command implementations
│   │   ├── auth.js
│   │   ├── accounts.js
│   │   ├── institutions.js
│   │   ├── agreements.js
│   │   ├── requisitions.js
│   │   ├── payments.js
│   │   └── config.js
│   └── lib/                 # Core libraries
│       ├── api.js           # API client
│       ├── auth.js          # Authentication
│       ├── config.js        # Configuration management
│       └── output.js        # Output formatting
├── test/                    # Tests
└── docs/                    # Documentation
```

## Coding Standards

- Use ES modules (import/export)
- Follow ESLint configuration
- Use JSDoc comments for all functions
- Maintain consistent code style
- Add tests for new features

## Testing

```bash
# Run all tests
npm test

# Run specific test file
node --test test/api.test.js

# Run with coverage (when configured)
npm run test:coverage
```

## Adding a New Command

1. Create a new file in `src/commands/`:

```javascript
// src/commands/newcommand.js
import { Command } from 'commander';
import { ensureAuth } from '../lib/auth.js';
import { createClient } from '../lib/api.js';

export const newCommand = new Command('newcommand')
  .description('Description of new command')
  .action(async (options) => {
    // Implementation
  });
```

2. Register the command in `bin/nordigen.js`:

```javascript
import { newCommand } from '../src/commands/newcommand.js';
program.addCommand(newCommand);
```

3. Add tests in `test/newcommand.test.js`

4. Update documentation

## Adding API Methods

Add new methods to `src/lib/api.js`:

```javascript
/**
 * Description of the method
 *
 * @param {string} param - Parameter description
 * @returns {Promise<Object>}
 */
async newMethod(param) {
  return this.get(`/api/v2/endpoint/${param}`);
}
```

## Documentation

When adding features, update:

- README.md - Main documentation
- EXAMPLES.md - Usage examples
- AGENT.md - AI agent patterns (if relevant)
- JSDoc comments in code

## Commit Messages

Follow conventional commits:

```
feat: add transaction export command
fix: handle rate limiting properly
docs: update installation instructions
test: add tests for auth module
refactor: simplify error handling
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added for new functionality
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No breaking changes (or clearly documented)

## Reporting Bugs

When reporting bugs, please include:

1. CLI version (`nordigen --version`)
2. Node.js version (`node --version`)
3. Operating system
4. Command that caused the issue
5. Expected behavior
6. Actual behavior
7. Error messages (use DEBUG=1 for detailed output)

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists
2. Explain the use case
3. Describe the desired behavior
4. Consider contributing the implementation

## Code Review Process

All contributions will be reviewed by maintainers. We look for:

- Code quality and style
- Test coverage
- Documentation
- Backwards compatibility
- Performance implications

## Release Process

Maintainers handle releases:

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm
5. Create GitHub release

## Questions?

- Open an issue for discussion
- Check existing issues and PRs
- Read the documentation

Thank you for contributing!

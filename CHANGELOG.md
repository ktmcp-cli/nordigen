# Changelog

All notable changes to the Nordigen CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-02-16

### Added
- Initial release of Nordigen CLI
- Complete coverage of Nordigen API v2 endpoints
- Authentication commands (login, logout, status)
- Institution commands (list, search, get)
- Account commands (get, balances, details, transactions)
- Agreement commands (list, create, get, delete, accept)
- Requisition commands (list, create, get, delete)
- Payment commands (list, get, delete, creditors, fields)
- Configuration management commands
- JWT token authentication with automatic refresh
- Secure credential storage using Conf
- Rich terminal output with colors and formatting
- JSON output mode for all commands
- Comprehensive error handling with detailed messages
- Support for all European banking institutions
- Premium transaction endpoint support
- Date range filtering for transactions
- Pagination support for list commands
- Environment variable support for credentials
- Debug mode with detailed stack traces
- Alias support for common commands (acc, inst, eua, req, pay)

### Documentation
- Complete README with installation and usage
- AGENT.md with AI agent integration patterns
- OPENCLAW.md with OpenClaw integration guide
- EXAMPLES.md with practical usage examples
- CONTRIBUTING.md with development guidelines
- Comprehensive JSDoc comments throughout codebase

### Testing
- Unit tests for API client
- Test infrastructure with Node.js test runner
- ESLint configuration for code quality

### Security
- Secure config file with 0600 permissions
- Credential redaction in output
- Token expiry handling
- Automatic token refresh

## [Unreleased]

### Planned Features
- Transaction export to multiple formats (CSV, Excel, QIF)
- Account balance tracking over time
- Transaction categorization with custom rules
- Multi-account aggregation commands
- Budget tracking and alerts
- Recurring transaction detection
- Data visualization commands
- Shell completion (bash, zsh, fish)
- Interactive mode
- Configuration profiles for multiple users
- Webhook support for real-time updates
- Integration with accounting software
- OpenClaw server mode
- Docker container support
- Binary releases for all platforms

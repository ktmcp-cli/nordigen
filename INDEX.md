# Nordigen CLI - Documentation Index

Quick navigation guide to all project documentation.

## Getting Started

**New to Nordigen CLI? Start here:**

1. [SETUP.md](./SETUP.md) - Installation and setup guide
2. [QUICKREF.md](./QUICKREF.md) - Quick reference card
3. [README.md](./README.md) - Complete user guide

## Documentation Files

### User Documentation

| File | Purpose | Lines |
|------|---------|-------|
| [README.md](./README.md) | Main documentation, usage guide | 380 |
| [QUICKREF.md](./QUICKREF.md) | Quick reference card | 150 |
| [SETUP.md](./SETUP.md) | Installation & setup | 180 |
| [EXAMPLES.md](./EXAMPLES.md) | Practical examples | 600 |

### Integration Guides

| File | Purpose | Lines |
|------|---------|-------|
| [AGENT.md](./AGENT.md) | AI agent integration patterns | 440 |
| [OPENCLAW.md](./OPENCLAW.md) | OpenClaw integration guide | 520 |

### Developer Documentation

| File | Purpose | Lines |
|------|---------|-------|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development guidelines | 180 |
| [PROJECT.md](./PROJECT.md) | Project overview | 450 |
| [CHANGELOG.md](./CHANGELOG.md) | Version history | 70 |
| [SUMMARY.md](./SUMMARY.md) | Project completion summary | 350 |

## By Use Case

### I want to...

#### Install and configure
→ [SETUP.md](./SETUP.md)

#### Learn the basics
→ [QUICKREF.md](./QUICKREF.md)
→ [README.md](./README.md)

#### See examples
→ [EXAMPLES.md](./EXAMPLES.md)

#### Build with AI agents
→ [AGENT.md](./AGENT.md)

#### Integrate with OpenClaw
→ [OPENCLAW.md](./OPENCLAW.md)

#### Contribute to the project
→ [CONTRIBUTING.md](./CONTRIBUTING.md)

#### Understand the architecture
→ [PROJECT.md](./PROJECT.md)

#### Check what's new
→ [CHANGELOG.md](./CHANGELOG.md)

## Code Documentation

### Core Files

| File | Purpose | Lines |
|------|---------|-------|
| [bin/nordigen.js](./bin/nordigen.js) | CLI entry point | 94 |
| [src/lib/api.js](./src/lib/api.js) | API client | 418 |
| [src/lib/auth.js](./src/lib/auth.js) | Authentication | 108 |
| [src/lib/config.js](./src/lib/config.js) | Configuration | 108 |
| [src/lib/output.js](./src/lib/output.js) | Output formatting | 222 |

### Command Modules

| File | Purpose | Lines |
|------|---------|-------|
| [src/commands/auth.js](./src/commands/auth.js) | Auth commands | 76 |
| [src/commands/accounts.js](./src/commands/accounts.js) | Account commands | 164 |
| [src/commands/institutions.js](./src/commands/institutions.js) | Institution commands | 149 |
| [src/commands/agreements.js](./src/commands/agreements.js) | Agreement commands | 200 |
| [src/commands/requisitions.js](./src/commands/requisitions.js) | Requisition commands | 182 |
| [src/commands/payments.js](./src/commands/payments.js) | Payment commands | 152 |
| [src/commands/config.js](./src/commands/config.js) | Config commands | 127 |

## Quick Links

### Essential Commands

```bash
# Get help
nordigen --help

# Check version
nordigen --version

# Authentication
nordigen auth login --secret-id <ID> --secret-key <KEY>
nordigen auth status

# Quick test
nordigen institutions list --country GB
```

### Common Workflows

See [EXAMPLES.md](./EXAMPLES.md) for:
- Complete bank connection flow
- Daily balance checks
- Transaction analysis
- Scripting patterns
- Automation examples

### API Reference

Official Nordigen API documentation:
- https://nordigen.com/en/docs/
- https://ob.nordigen.com/api/swagger/

## File Organization

```
nordigen-cli/
├── Documentation (*.md)
│   ├── User guides         → README, SETUP, QUICKREF, EXAMPLES
│   ├── Integration guides  → AGENT, OPENCLAW
│   └── Developer docs      → CONTRIBUTING, PROJECT, CHANGELOG
│
├── Source code (src/)
│   ├── commands/          → Command implementations
│   └── lib/              → Core libraries
│
├── Entry point (bin/)
│   └── nordigen.js       → Main CLI
│
├── Tests (test/)
│   └── *.test.js         → Unit tests
│
└── Configuration
    ├── package.json      → NPM config
    ├── .eslintrc.json   → Linting
    └── .env.example     → Environment template
```

## Support Resources

- **GitHub Issues**: https://github.com/ktmcp/nordigen-cli/issues
- **API Docs**: https://nordigen.com/en/docs/
- **Examples**: [EXAMPLES.md](./EXAMPLES.md)
- **Troubleshooting**: [SETUP.md](./SETUP.md#troubleshooting)

## Project Statistics

- **Total Files**: 27
- **Total Lines**: 5,321
- **Commands**: 40+ subcommands
- **API Endpoints**: 27 implemented
- **Documentation**: 3,200+ lines

## Version Information

- **Current Version**: 1.0.0
- **Release Date**: 2024-02-16
- **License**: MIT
- **Node.js**: 18+ required

## Learning Path

### Beginner
1. Install → [SETUP.md](./SETUP.md)
2. Learn basics → [QUICKREF.md](./QUICKREF.md)
3. Try examples → [EXAMPLES.md](./EXAMPLES.md)

### Intermediate
1. Read full guide → [README.md](./README.md)
2. Explore examples → [EXAMPLES.md](./EXAMPLES.md)
3. Learn scripting → [EXAMPLES.md](./EXAMPLES.md#scripting-and-automation)

### Advanced
1. Study architecture → [PROJECT.md](./PROJECT.md)
2. AI integration → [AGENT.md](./AGENT.md)
3. Contribute → [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Navigation tip**: Use your editor's file search (Ctrl+P / Cmd+P) to quickly jump to any documentation file.

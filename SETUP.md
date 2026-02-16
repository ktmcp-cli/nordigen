# Nordigen CLI - Setup & Installation Guide

Complete setup guide for getting the Nordigen CLI running.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Nordigen Account**: Sign up at https://nordigen.com

## Quick Setup (Automated)

```bash
cd /workspace/group/ktmcp/workspace/nordigen
./scripts/quickstart.sh
```

The script will:
1. Check Node.js version
2. Install dependencies
3. Make CLI executable
4. Link CLI globally
5. Authenticate (if credentials are set)

## Manual Setup

### 1. Install Dependencies

```bash
cd /workspace/group/ktmcp/workspace/nordigen
npm install
```

This installs:
- `commander` - CLI framework
- `chalk` - Terminal colors
- `ora` - Spinners
- `conf` - Configuration storage
- `node-fetch` - HTTP client
- `date-fns` - Date utilities

### 2. Make Executable

```bash
chmod +x bin/nordigen.js
```

### 3. Link CLI Globally

```bash
npm link
```

This creates a global `nordigen` command.

**Verify installation:**
```bash
nordigen --version
nordigen --help
```

### 4. Get API Credentials

1. Visit https://nordigen.com/en/account/login/
2. Sign up or log in
3. Navigate to: **User Secrets** → **Create New Secret**
4. Copy your:
   - Secret ID
   - Secret Key

### 5. Configure Credentials

**Option A: Environment Variables (Recommended)**

```bash
export NORDIGEN_SECRET_ID="your-secret-id-here"
export NORDIGEN_SECRET_KEY="your-secret-key-here"
```

Add to your `~/.bashrc` or `~/.zshrc` for persistence.

**Option B: Login Command**

```bash
nordigen auth login \
  --secret-id "your-secret-id" \
  --secret-key "your-secret-key"
```

Credentials are stored securely in:
- Linux/macOS: `~/.config/nordigen-cli/config.json`
- Windows: `%APPDATA%\nordigen-cli\config.json`

**Option C: .env File**

```bash
cp .env.example .env
# Edit .env and add your credentials
```

### 6. Test Installation

```bash
# Check authentication
nordigen auth status

# List institutions in UK
nordigen institutions list --country GB

# Get specific institution
nordigen institutions get BARCLAYS_BARCGB22
```

## Post-Installation

### Set Default Country (Optional)

```bash
nordigen config set-country GB
```

### Enable Debug Mode (Optional)

```bash
export DEBUG=1
nordigen accounts balances <account-id>
```

## Troubleshooting

### "Command not found: nordigen"

**Solution**: Ensure `npm link` completed successfully and npm global bin is in PATH.

```bash
# Check npm global bin path
npm config get prefix

# Add to PATH (if needed)
export PATH="$(npm config get prefix)/bin:$PATH"
```

### "Not authenticated" error

**Solution**: Login with your credentials.

```bash
nordigen auth login --secret-id <id> --secret-key <key>
```

### Token expired

**Solution**: The CLI automatically refreshes tokens. If that fails, re-login.

```bash
nordigen auth status
nordigen auth login --secret-id <id> --secret-key <key>
```

### Permission denied on config file

**Solution**: Fix file permissions.

```bash
chmod 600 ~/.config/nordigen-cli/config.json
```

### Module not found errors

**Solution**: Reinstall dependencies.

```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Setup

For contributing to the CLI:

```bash
# Clone the repository
git clone https://github.com/ktmcp/nordigen-cli.git
cd nordigen-cli

# Install dependencies
npm install

# Link for local development
npm link

# Run tests
npm test

# Lint code
npm run lint
```

## Uninstallation

```bash
# Unlink global command
npm unlink -g @ktmcp-cli/nordigen

# Or if installed via npm
npm uninstall -g @ktmcp-cli/nordigen

# Remove config (optional)
rm -rf ~/.config/nordigen-cli
```

## Updating

### From Source

```bash
cd nordigen-cli
git pull
npm install
```

### From NPM

```bash
npm update -g @ktmcp-cli/nordigen
```

## Docker Setup (Alternative)

Coming soon - Docker container for isolated environments.

## Next Steps

After successful installation:

1. Read [README.md](./README.md) for full documentation
2. Try [EXAMPLES.md](./EXAMPLES.md) for practical use cases
3. Check [QUICKREF.md](./QUICKREF.md) for command reference
4. See [AGENT.md](./AGENT.md) for AI integration

## Support

- **Issues**: https://github.com/ktmcp/nordigen-cli/issues
- **Documentation**: See *.md files in this directory
- **API Docs**: https://nordigen.com/en/docs/

## Verification Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] CLI executable (`chmod +x bin/nordigen.js`)
- [ ] CLI linked globally (`npm link`)
- [ ] `nordigen --version` works
- [ ] Nordigen account created
- [ ] API credentials obtained
- [ ] Authenticated (`nordigen auth login`)
- [ ] Test command works (`nordigen institutions list --country GB`)

Once all items are checked, you're ready to use the Nordigen CLI!

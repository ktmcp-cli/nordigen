#!/bin/bash

# Nordigen CLI Quick Start Script
# This script helps you get started with the Nordigen CLI

set -e

echo "======================================"
echo "Nordigen CLI - Quick Start"
echo "======================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js version 18 or higher is required"
    echo "Current version: $(node --version)"
    exit 1
fi

echo "Node.js version: $(node --version) ✓"
echo

# Install dependencies
echo "Installing dependencies..."
npm install
echo "Dependencies installed ✓"
echo

# Make CLI executable
chmod +x bin/nordigen.js
echo "Made CLI executable ✓"
echo

# Link CLI
echo "Linking CLI globally..."
npm link
echo "CLI linked ✓"
echo

# Check if credentials are set
if [ -z "$NORDIGEN_SECRET_ID" ] || [ -z "$NORDIGEN_SECRET_KEY" ]; then
    echo "======================================"
    echo "Setup Instructions"
    echo "======================================"
    echo
    echo "1. Get API credentials:"
    echo "   Visit https://nordigen.com/en/account/login/"
    echo "   Navigate to: User Secrets → Create New Secret"
    echo
    echo "2. Set environment variables:"
    echo "   export NORDIGEN_SECRET_ID='your_secret_id'"
    echo "   export NORDIGEN_SECRET_KEY='your_secret_key'"
    echo
    echo "3. Authenticate:"
    echo "   nordigen auth login \\"
    echo "     --secret-id \$NORDIGEN_SECRET_ID \\"
    echo "     --secret-key \$NORDIGEN_SECRET_KEY"
    echo
    echo "4. Test the CLI:"
    echo "   nordigen institutions list --country GB"
    echo
else
    echo "======================================"
    echo "Authenticating..."
    echo "======================================"
    echo

    if nordigen auth login \
        --secret-id "$NORDIGEN_SECRET_ID" \
        --secret-key "$NORDIGEN_SECRET_KEY"; then
        echo
        echo "Authentication successful ✓"
        echo

        # Test with a simple command
        echo "Testing CLI..."
        if nordigen institutions list --country GB --json > /dev/null 2>&1; then
            echo "CLI test successful ✓"
            echo

            echo "======================================"
            echo "Quick Start Complete!"
            echo "======================================"
            echo
            echo "Try these commands:"
            echo "  nordigen --help"
            echo "  nordigen institutions list --country GB"
            echo "  nordigen auth status"
            echo
        else
            echo "Warning: CLI test failed"
            echo "Check your credentials and try again"
        fi
    else
        echo
        echo "Authentication failed"
        echo "Please check your credentials and try again"
        exit 1
    fi
fi

echo "For more information, see README.md"
echo

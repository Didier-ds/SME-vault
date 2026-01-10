#!/bin/bash

# Development helper script for SME Vault
# Makes it easy to see logs while developing

echo "🚀 SME Vault - Development Mode"
echo ""

case "$1" in
  "validator")
    echo "Starting local validator..."
    solana-test-validator
    ;;

  "logs")
    echo "Watching transaction logs..."
    echo "All msg!() outputs will appear here"
    solana logs
    ;;

  "test")
    echo "Running tests (with logs)..."
    anchor test
    ;;

  "test-file")
    if [ -z "$2" ]; then
      echo "Usage: ./dev.sh test-file <filename>"
      echo "Example: ./dev.sh test-file remove-approver"
      exit 1
    fi
    echo "Running tests for $2.ts..."
    anchor test tests/$2.ts
    ;;

  "build")
    echo "Building program..."
    anchor build
    ;;

  "clean")
    echo "Cleaning build artifacts..."
    anchor clean
    rm -rf target/
    ;;

  *)
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  validator    - Start local Solana validator"
    echo "  logs         - Watch transaction logs (run in separate terminal)"
    echo "  test         - Run all tests with logs"
    echo "  test-file    - Run specific test file (e.g., ./dev.sh test-file remove-approver)"
    echo "  build        - Build the program"
    echo "  clean        - Clean build artifacts"
    echo ""
    echo "Typical workflow:"
    echo "  Terminal 1: ./dev.sh validator"
    echo "  Terminal 2: ./dev.sh logs"
    echo "  Terminal 3: ./dev.sh test-file remove-approver"
    exit 1
    ;;
esac

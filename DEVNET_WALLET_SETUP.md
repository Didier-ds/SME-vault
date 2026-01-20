# Devnet Wallet Setup Guide

Complete guide to create devnet wallets, export keys, import into extensions (Phantom/Solflare), and fund them for testing.

---

## 🎯 Quick Summary

1. Create wallet with Solana CLI → Export keypair → Import to Phantom/Solflare → Fund with devnet SOL
2. **Time:** ~5 minutes per wallet

---

## 📋 Method 1: Using Solana CLI (Recommended)

### Step 1: Create a New Keypair

```bash
# Generate a new keypair and save to file
solana-keygen new --outfile ~/.config/solana/devnet-wallet-1.json

# You'll be prompted for a passphrase (optional but recommended)
# Or skip with Enter

# Example output:
# Generating a new keypair
# 
# For added security, enter a BIP39 passphrase
# NOTE! This passphrase improves security of the recovery seed phrase ONLY
#       It does NOT encrypt the keypair file itself.
# 
# BIP39 Passphrase (empty for none):
# 
# Wrote new keypair to /Users/apple/.config/solana/devnet-wallet-1.json
# ================================================================================
# pubkey: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

**Save the pubkey** - you'll need it for funding and importing!

### Step 2: Get the Private Key (Base58 format for Phantom/Solflare)

```bash
# View the private key in base58 format (what wallet extensions use)
solana-keygen pubkey ~/.config/solana/devnet-wallet-1.json

# To get the actual private key array for manual import:
cat ~/.config/solana/devnet-wallet-1.json

# This outputs a JSON array like:
# [123,45,67,89,...]
# This is what you'll copy when importing
```

### Step 3: Export Private Key (Alternative method)

If you need the private key in different formats:

```bash
# Get public key
solana-keygen pubkey ~/.config/solana/devnet-wallet-1.json

# The JSON file contains the private key as a byte array
# You can read it directly:
cat ~/.config/solana/devnet-wallet-1.json
```

**The JSON file format:**
```json
[123,45,67,89,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90]
```

This is a 64-byte array (first 32 bytes are private key, last 32 are public key seed).

### Step 4: Configure Solana CLI for Devnet

```bash
# Switch to devnet
solana config set --url devnet

# Verify it's set correctly
solana config get

# Should show:
# Config File: /Users/apple/.config/solana/cli/config.yml
# RPC URL: https://api.devnet.solana.com
# WebSocket URL: wss://api.devnet.solana.com/ (auto)
# Keypair Path: /Users/apple/.config/solana/devnet-wallet-1.json
# Commitment: confirmed
```

### Step 5: Fund the Wallet

```bash
# Airdrop 2 SOL (devnet limit per request)
solana airdrop 2 ~/.config/solana/devnet-wallet-1.json

# Or use the pubkey directly
solana airdrop 2 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

# If you need more SOL (devnet only):
solana airdrop 2  # Repeat multiple times (each request gives max 2 SOL)
solana airdrop 2
solana airdrop 2
# Continue until you have enough

# Check balance
solana balance ~/.config/solana/devnet-wallet-1.json
```

**Note:** Devnet airdrops have rate limits. If it fails, wait 30 seconds and try again.

---

## 🔐 Method 2: Import into Phantom Wallet

### Step 1: Open Phantom and Go to Settings

1. Open Phantom extension
2. Click the **gear icon** (⚙️) or **Settings** in the menu
3. Go to **Security & Privacy** section

### Step 2: Import Private Key

**Option A: Import from JSON file (easiest)**

1. In Phantom, click **Add/Connect Wallet** → **Import Private Key**
2. Open your keypair file:
   ```bash
   cat ~/.config/solana/devnet-wallet-1.json
   ```
3. Copy the entire JSON array: `[123,45,67,...]`
4. Paste into Phantom's import field
5. Click **Import**

**Option B: Import from Secret Key (Base58)**

If Phantom asks for a secret key in base58 format:

```bash
# Convert to base58 (if needed - Phantom might accept the JSON array directly)
# Most wallet extensions accept the JSON array format now
```

### Step 3: Switch to Devnet in Phantom

1. In Phantom, click the network selector at the top
2. Select **Devnet** (not Mainnet)
3. Your wallet should now show the devnet balance

### Step 4: Verify Balance

1. Check that the public key matches: `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`
2. Check the SOL balance (should show the airdropped amount)

---

## 🔐 Method 3: Import into Solflare Wallet

### Step 1: Open Solflare and Go to Import

1. Open Solflare extension
2. Click **Import Wallet** (or **Add Account** → **Import**)

### Step 2: Import Private Key

1. Select **Private Key** as import method
2. Copy the JSON array from your keypair file:
   ```bash
   cat ~/.config/solana/devnet-wallet-1.json
   ```
3. Paste the entire array into Solflare's import field
4. Click **Import**

### Step 3: Switch to Devnet in Solflare

1. Click the network selector (usually shows "Mainnet")
2. Select **Devnet**
3. Your wallet should now show the devnet balance

---

## 🚀 Quick Script: Create Multiple Wallets

Here's a script to create multiple wallets at once:

```bash
#!/bin/bash

# Create directory for test wallets
mkdir -p ~/.config/solana/test-wallets

# Create 3 wallets (Owner, Approver, Staff)
for i in {1..3}; do
  echo "Creating wallet $i..."
  solana-keygen new --outfile ~/.config/solana/test-wallets/wallet-$i.json --no-bip39-passphrase
  
  # Get public key
  PUBKEY=$(solana-keygen pubkey ~/.config/solana/test-wallets/wallet-$i.json)
  echo "Wallet $i pubkey: $PUBKEY"
  
  # Fund with 2 SOL
  echo "Funding wallet $i..."
  solana airdrop 2 $PUBKEY --url devnet
  
  # Show balance
  solana balance $PUBKEY --url devnet
  
  echo "---"
done

echo "All wallets created and funded!"
echo "Keypair files: ~/.config/solana/test-wallets/"
```

**To use the script:**

```bash
# Save as create-wallets.sh
chmod +x create-wallets.sh
./create-wallets.sh
```

---

## 📝 Complete Workflow Example

### Creating 3 Test Wallets (Owner, Approver, Staff)

```bash
# 1. Set to devnet
solana config set --url devnet

# 2. Create Owner wallet
solana-keygen new --outfile ~/.config/solana/owner.json --no-bip39-passphrase
OWNER_PUBKEY=$(solana-keygen pubkey ~/.config/solana/owner.json)
echo "Owner: $OWNER_PUBKEY"
solana airdrop 5 $OWNER_PUBKEY
solana balance $OWNER_PUBKEY

# 3. Create Approver wallet
solana-keygen new --outfile ~/.config/solana/approver.json --no-bip39-passphrase
APPROVER_PUBKEY=$(solana-keygen pubkey ~/.config/solana/approver.json)
echo "Approver: $APPROVER_PUBKEY"
solana airdrop 5 $APPROVER_PUBKEY
solana balance $APPROVER_PUBKEY

# 4. Create Staff wallet
solana-keygen new --outfile ~/.config/solana/staff.json --no-bip39-passphrase
STAFF_PUBKEY=$(solana-keygen pubkey ~/.config/solana/staff.json)
echo "Staff: $STAFF_PUBKEY"
solana airdrop 5 $STAFF_PUBKEY
solana balance $STAFF_PUBKEY

# 5. Show all keypair locations
echo "=== Keypair Files ==="
echo "Owner: ~/.config/solana/owner.json"
echo "Approver: ~/.config/solana/approver.json"
echo "Staff: ~/.config/solana/staff.json"
```

### Import into Phantom/Solflare

For each wallet:

1. **Copy the private key:**
   ```bash
   # For Owner
   cat ~/.config/solana/owner.json
   
   # Copy the output: [123,45,67,...]
   ```

2. **In Phantom:**
   - Settings → Import Private Key
   - Paste the JSON array
   - Name it "Owner", "Approver", or "Staff"
   - Switch network to Devnet

3. **Repeat for Approver and Staff wallets**

---

## ✅ Verification Checklist

After importing each wallet:

- [ ] Public key matches the one from CLI
- [ ] Wallet shows in extension (Phantom/Solflare)
- [ ] Network is set to Devnet (not Mainnet)
- [ ] Balance shows the airdropped SOL amount
- [ ] You can see the wallet address in the extension

---

## 🔍 Troubleshooting

### Problem: Airdrop fails with "429 Too Many Requests"

**Solution:** Devnet rate limiting. Wait 30-60 seconds between requests.

```bash
# Wait a bit, then try again
sleep 30
solana airdrop 2 <pubkey>
```

### Problem: Can't import into Phantom - "Invalid private key"

**Solution:** 
- Make sure you're copying the entire JSON array including brackets: `[123,45,...]`
- Don't include newlines or extra spaces
- Try removing any file path if you accidentally copied that

### Problem: Wallet shows 0 SOL in Phantom but has balance in CLI

**Solution:**
- Check that Phantom is set to **Devnet** (not Mainnet)
- Click the network selector at top of Phantom
- Select "Devnet"

### Problem: "Account not found" error

**Solution:**
- The wallet might not be funded yet
- Run airdrop again:
  ```bash
  solana airdrop 2 <pubkey> --url devnet
  ```

### Problem: Can't find the keypair file

**Solution:**
```bash
# List all Solana keypairs
ls -la ~/.config/solana/*.json

# Or find recent ones
find ~/.config/solana -name "*.json" -type f
```

---

## 📋 Quick Reference Commands

```bash
# Create new wallet
solana-keygen new --outfile <path> --no-bip39-passphrase

# Get public key
solana-keygen pubkey <keypair-file>

# View private key (JSON array)
cat <keypair-file>

# Fund wallet (devnet)
solana airdrop 2 <pubkey> --url devnet

# Check balance
solana balance <pubkey> --url devnet

# Switch to devnet
solana config set --url devnet

# Check current config
solana config get
```

---

## 🔐 Security Notes

⚠️ **Important Security Warnings:**

1. **These are test wallets only** - Never use devnet keys for mainnet
2. **Private keys are sensitive** - Don't share or commit to Git
3. **Add to `.gitignore`:**
   ```bash
   echo "*.json" >> ~/.config/solana/.gitignore
   ```
4. **File permissions:** Keep keypair files private
   ```bash
   chmod 600 ~/.config/solana/*.json
   ```

---

## 🎯 For Demo Recording

**Recommended Setup:**

1. **Create 3 wallets:**
   - Owner wallet (for creating vaults and managing team)
   - Approver wallet (for approving withdrawals)
   - Staff wallet (for requesting withdrawals)

2. **Fund each with 5-10 SOL** (enough for multiple transactions)

3. **Import all into Phantom** (or separate browser profiles)

4. **Name them clearly:**
   - "Owner - Devnet"
   - "Approver - Devnet"  
   - "Staff - Devnet"

5. **Keep keypair files safe** for backup:
   ```bash
   # Backup your test wallets
   cp -r ~/.config/solana/test-wallets ~/backups/
   ```

---

**Last Updated:** [Current Date]
**Tested On:** macOS, Solana CLI 1.18+, Phantom 0.30+, Solflare 3.0+
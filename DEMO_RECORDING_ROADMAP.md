# Feature Recording & Testing Roadmap

Complete step-by-step guide to record all features of SME Vault and test it on a new browser.

## 📋 Quick Overview

**What You'll Record:**
1. Landing Page & Wallet Connection
2. Dashboard Overview
3. Create Vault (Complete Flow)
4. Team Management (Add/Remove Approvers & Staff)
5. Request Withdrawal
6. Approve Withdrawal
7. Execute Withdrawal
8. View Withdrawals Page
9. Activity History
10. Vault Switching
11. Role-Based Access
12. Edge Cases & Validations

**Estimated Recording Time:** 10-15 minutes for complete feature walkthrough

**Test Browsers:** Chrome, Firefox, Safari, Edge (or Incognito mode)

---

## 📋 Phase 1: Pre-Recording Preparation

### 1.1 Ensure Application is Running
```bash
# Navigate to app directory
cd /Users/apple/RustroverProjects/SME-vault/app

# Install dependencies (if not already done)
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
```

**Expected Output:** Server should start on `http://localhost:3000` (or next available port)

**Checklist:**
- [ ] Server starts without errors
- [ ] No console errors in terminal
- [ ] Application loads in browser
- [ ] Wallet connection works (Phantom/Solflare)

### 1.2 Prepare Test Data & Environment

**For Local Development:**
```bash
# Terminal 1: Start local Solana validator
solana-test-validator --reset

# Terminal 2: Deploy smart contract (if not already deployed)
cd /Users/apple/RustroverProjects/SME-vault
anchor build
anchor deploy

# Terminal 3: Airdrop SOL to test wallets
solana airdrop 10
```

**For Devnet Testing:**
- Ensure you have devnet SOL in your wallet
- Verify program is deployed to devnet
- Update `.env` file with devnet RPC URL

**Checklist:**
- [ ] Smart contract deployed
- [ ] Test wallets have SOL for transactions
- [ ] Test vault created (if needed for demo)
- [ ] Test approvers/staff added (if needed)
- [ ] Test withdrawal requests exist (if needed)

### 1.3 Prepare Test Data

**Before Recording, Set Up:**
- [ ] Create test wallets (at least 3):
  1. **Owner wallet** - for creating vault and managing team
  2. **Approver wallet** - for approving withdrawals
  3. **Staff wallet** - for requesting withdrawals
- [ ] Fund all wallets with test SOL (for transaction fees)
- [ ] Fund vault with test tokens (if testing token transfers)
- [ ] Note wallet addresses for easy copy-paste during recording
- [ ] Have a list of test amounts ready:
  - Small withdrawal (within limits): e.g., 10,000
  - Large withdrawal (triggers delay): e.g., 100,000

**Optional but Recommended:**
- [ ] Pre-create a vault for faster recording (skip creation flow)
- [ ] Pre-create a pending withdrawal request (to show approval flow)
- [ ] Have Solana explorer open for showing transaction details

### 1.4 Prepare Browser Environment

**Current Browser Setup:**
- [ ] Clear browser cache (optional, for clean state)
- [ ] Install/connect wallet extension (Phantom or Solflare)
- [ ] Connect wallet to correct network (localnet/devnet)
- [ ] Ensure wallet has test SOL
- [ ] Close unnecessary tabs/extensions
- [ ] Set browser zoom to 100% (for consistent recording)

---

## 🎥 Phase 2: Screen Recording Setup

### 2.1 Choose Recording Tool

**macOS Built-in Options:**
- **QuickTime Player** (Free, built-in)
  - Open QuickTime → File → New Screen Recording
  - Good quality, simple interface
  - Records system audio + microphone

- **Screen Recording (macOS Shortcut)**
  - Press `Shift + Command + 5`
  - Choose "Record Entire Screen" or "Record Selected Portion"
  - Click "Options" to set quality, microphone, etc.

**Third-Party Options:**
- **OBS Studio** (Free, professional)
  - Advanced features: overlays, multiple sources, streaming
  - Best for high-quality demos
  - Download: https://obsproject.com/

- **Loom** (Free tier available)
  - Easy sharing, webcam overlay
  - Automatic cloud upload
  - Download: https://www.loom.com/

- **ScreenFlow** (Paid, macOS only)
  - Professional editing features
  - Best for polished demos

### 2.2 Configure Recording Settings

**Recommended Settings:**
- **Resolution:** 1920x1080 (1080p) or native display resolution
- **Frame Rate:** 30 FPS (60 FPS if available, smoother)
- **Audio:** 
  - System audio: ON (if you want to capture app sounds)
  - Microphone: ON (for narration)
  - Test microphone levels before recording
- **Recording Area:** 
  - Full screen (if showing entire app)
  - Or select browser window only (cleaner)
- **File Format:** MP4 (widely compatible)

**Checklist:**
- [ ] Recording tool installed/ready
- [ ] Test recording (30 seconds) to verify quality
- [ ] Microphone levels tested
- [ ] Recording area selected
- [ ] File save location known

### 2.3 Prepare Recording Environment

**Physical Setup:**
- [ ] Quiet environment (minimize background noise)
- [ ] Good lighting (if using webcam)
- [ ] Close unnecessary applications
- [ ] Disable notifications (Do Not Disturb mode)
- [ ] Close Slack, email, etc.

**Browser Setup:**
- [ ] Open app in clean browser window
- [ ] Full screen browser (F11 or maximize)
- [ ] Hide browser bookmarks bar (cleaner look)
- [ ] Set browser to 100% zoom
- [ ] Clear any error messages/console

---

## 🎬 Phase 3: Recording the Demo

### 3.1 Pre-Recording Checklist

**Final Checks:**
- [ ] App is running and loaded
- [ ] Wallet is connected
- [ ] Test data is ready
- [ ] Presentation script is visible (second monitor or printed)
- [ ] Recording tool is ready
- [ ] Microphone is working
- [ ] All notifications disabled

### 3.2 Feature-by-Feature Recording Guide

**Complete Feature Walkthrough (~10-15 minutes)**

#### **Feature 1: Landing Page (30 seconds)**
- [ ] Start recording
- [ ] Show landing page (`http://localhost:3000`)
- [ ] Narrate: "SME Vault landing page with hero section and features"
- [ ] Scroll through features section
- [ ] Click "Launch App" or "Get Started" button

#### **Feature 2: Wallet Connection (45 seconds)**
- [ ] Show dashboard (wallet not connected state)
- [ ] Click "Connect Wallet" button
- [ ] Show wallet extension popup (Phantom/Solflare)
- [ ] Connect wallet
- [ ] Narrate: "Connected wallet - [address shown]"
- [ ] Show wallet address displayed in header

#### **Feature 3: Dashboard Overview (1 minute)**
- [ ] Show dashboard with vault selector (if vaults exist)
- [ ] Show empty state if no vaults (or show existing vault)
- [ ] Narrate: "Dashboard shows vault overview, balance, and withdrawal requests"
- [ ] Point out key UI elements:
  - Vault balance
  - Pending withdrawal requests
  - Action buttons (if available based on role)

#### **Feature 4: Create Vault - Full Flow (3-4 minutes)**
- [ ] Click "Create Vault" button (from dashboard or navigate to `/dashboard/create-vault`)
- [ ] **Step 1: Basic Information**
  - Enter vault name (e.g., "Demo Vault")
  - Show form validation (try empty name, see error)
  - Enter valid name
- [ ] **Step 2: Security Settings**
  - Set approval threshold (e.g., 2)
  - Set daily limit (e.g., 1000000)
  - Set transaction limit (e.g., 100000)
  - Set large withdrawal threshold (e.g., 50000)
  - Set delay hours (e.g., 24)
  - Narrate: "Configure vault security parameters"
- [ ] **Step 3: Token Mint**
  - Show token mint field (default USDC devnet mint)
  - Explain or change if needed
- [ ] **Step 4: Add Approvers**
  - Click "Add Approver" button
  - Enter approver wallet address
  - Add multiple approvers (e.g., 3 approvers)
  - Show approver list
  - Narrate: "Added approvers who can approve withdrawals"
- [ ] **Step 5: Add Staff**
  - Click "Add Staff" button
  - Enter staff wallet address
  - Add staff members (e.g., 2 staff)
  - Show staff list
  - Narrate: "Added staff who can request withdrawals"
- [ ] **Step 6: Review & Create**
  - Show summary of all settings
  - Click "Create Vault" button
  - Show transaction signing in wallet
  - Narrate: "Signing transaction to create vault on-chain"
  - Wait for transaction confirmation
  - Show success message
  - Narrate: "Vault created successfully!"

#### **Feature 5: Vault Management - Team Management (2 minutes)**
- [ ] On dashboard, click "Manage Team" button (if owner)
- [ ] Show team management modal
- [ ] **Add Approver:**
  - Click "Add Approver"
  - Enter new approver address
  - Submit and sign transaction
  - Show updated approver list
- [ ] **Add Staff:**
  - Click "Add Staff"
  - Enter new staff address
  - Submit and sign transaction
  - Show updated staff list
- [ ] **Remove Member:**
  - Show remove option (if exists)
  - Demonstrate removing approver or staff
- [ ] Close modal
- [ ] Narrate: "Team members can be added or removed by the owner"

#### **Feature 6: Request Withdrawal (2 minutes)**
- [ ] Switch to staff account (or use staff role if available)
- [ ] Click "Request Withdrawal" button
- [ ] **Withdrawal Request Form:**
  - Enter amount (e.g., 10000 - within limits)
  - Enter destination wallet address
  - Show form validation
  - Narrate: "Staff member requesting withdrawal"
- [ ] Submit withdrawal request
- [ ] Show transaction signing
- [ ] Wait for confirmation
- [ ] Show success message
- [ ] Narrate: "Withdrawal request created - now pending approval"

#### **Feature 7: View Withdrawal Requests (1 minute)**
- [ ] Show withdrawal requests on dashboard
- [ ] Navigate to `/dashboard/withdrawals` page
- [ ] Show withdrawal request card with:
  - Request ID/address
  - Amount
  - Destination
  - Status (Pending)
  - Approval progress (X of Y approvals)
  - Requester address
- [ ] Narrate: "All withdrawal requests shown with status and details"

#### **Feature 8: Approve Withdrawal (2 minutes)**
- [ ] Switch to approver account (or use approver role)
- [ ] Navigate to withdrawals page
- [ ] Find pending withdrawal request
- [ ] Show approval button/action
- [ ] Click "Approve" button
- [ ] Show transaction signing prompt
- [ ] Sign transaction
- [ ] Wait for confirmation
- [ ] Show updated approval progress
  - "1 of 2 approvals" → "2 of 2 approvals"
  - Status changes to "Approved" (if threshold met)
- [ ] Narrate: "Approver voting on withdrawal - threshold met, ready for execution"

#### **Feature 9: Execute Withdrawal (1.5 minutes)**
- [ ] Show approved withdrawal request
- [ ] Check if time delay is required (large withdrawal)
  - If large withdrawal, show "Delay active" message
  - Narrate: "Large withdrawal requires time delay before execution"
- [ ] Click "Execute" button (when available)
- [ ] Show transaction signing
- [ ] Sign transaction
- [ ] Wait for confirmation
- [ ] Show success message
- [ ] Status changes to "Executed"
- [ ] Show transaction signature/explorer link
- [ ] Narrate: "Withdrawal executed - tokens transferred to destination"

#### **Feature 10: Activity/Transaction History (1 minute)**
- [ ] Navigate to `/dashboard/activity` page (if exists)
- [ ] Show activity feed/transaction history
- [ ] Show recent activities:
  - Vault creation
  - Team member additions
  - Withdrawal requests
  - Approvals
  - Executions
- [ ] Narrate: "Complete audit trail of all vault activities"

#### **Feature 11: Vault Switching (30 seconds)**
- [ ] If multiple vaults exist, show vault selector
- [ ] Click vault dropdown
- [ ] Select different vault
- [ ] Show dashboard updates with new vault data
- [ ] Narrate: "Switch between multiple vaults"

#### **Feature 12: Role-Based Access (1 minute)**
- [ ] **As Owner:**
  - Show "Manage Team" button visible
  - Show all controls available
- [ ] **As Approver:**
  - Show approval buttons visible
  - Show request withdrawal button hidden (if staff-only)
- [ ] **As Staff:**
  - Show "Request Withdrawal" button visible
  - Show approval buttons hidden
- [ ] Narrate: "Different features available based on user role"

#### **Feature 13: Edge Cases & Validations (1-2 minutes)**
- [ ] Try requesting withdrawal exceeding limit → show error
- [ ] Try approving own request (if requester is approver) → show error
- [ ] Show time delay countdown for large withdrawals
- [ ] Show empty states (no vaults, no withdrawals)
- [ ] Narrate: "System enforces security rules and validates all actions"

#### **Feature 14: Closing (30 seconds)**
- [ ] Return to dashboard
- [ ] Show complete vault overview
- [ ] Summarize: "This is SME Vault - secure treasury management with multi-signature approvals, time delays, and role-based access control, all enforced on-chain via Solana smart contracts"
- [ ] Stop recording

### 3.3 Recording Tips

**During Recording:**
- Speak clearly and at natural pace (~150 words/minute)
- Pause briefly after key points
- Move mouse smoothly (avoid rapid movements)
- Use consistent terminology (e.g., "approver" not "approver/admin")
- Narrate what you're doing: "Now I'm clicking the Create Vault button..."
- Explain features as you show them: "This shows the approval progress..."
- If you make a mistake, pause, say "Let me redo that", then continue (can edit later)
- Keep energy consistent throughout
- Don't rush through UI interactions - viewers need time to see what's happening

**Common Mistakes to Avoid:**
- ❌ Clicking too fast (hard to follow)
- ❌ Speaking while typing (unclear audio)
- ❌ Not explaining what's happening on screen
- ❌ Showing error messages without explaining (unless intentional)
- ❌ Forgetting to show transaction confirmations
- ❌ Skipping the "wait for transaction" step (important for realism)
- ❌ Background noise or interruptions
- ❌ Switching wallets too quickly (viewers might miss it)

### 3.4 Post-Recording

**Immediate Actions:**
- [ ] Stop recording
- [ ] Save file with descriptive name: `SME-Vault-Demo-YYYY-MM-DD.mp4`
- [ ] Verify file saved correctly
- [ ] Play back recording to check:
  - Audio quality
  - Video quality
  - All actions are visible
  - No critical errors shown

**If Recording Needs Editing:**
- Use video editor (iMovie, Final Cut, Adobe Premiere, or OBS)
- Trim unnecessary parts
- Add text overlays if needed
- Adjust audio levels
- Export final version

---

## 🌐 Phase 4: Testing on New Browser

### 4.1 What "New Browser" Means

**Options:**
1. **Different Browser** (Chrome → Firefox, Safari → Chrome, etc.)
2. **Incognito/Private Mode** (simulates fresh user)
3. **Fresh Browser Profile** (new user account)
4. **Different Device** (mobile, tablet)
5. **Completely Clean Install** (uninstall/reinstall browser)

**Recommended Approach:** Test in **Incognito Mode** first (quickest), then **different browser** (most comprehensive).

### 4.2 Test in Incognito/Private Mode

**Chrome:**
```bash
# Open incognito window
Command + Shift + N
# Or: File → New Incognito Window
```

**Firefox:**
```bash
# Open private window
Command + Shift + P
# Or: File → New Private Window
```

**Safari:**
```bash
# Open private window
Command + Shift + N
# Or: File → New Private Window
```

**Steps:**
1. [ ] Open incognito/private window
2. [ ] Navigate to `http://localhost:3000` (or your deployed URL)
3. [ ] Install wallet extension in incognito (if needed)
   - Note: Some extensions don't work in incognito by default
   - Enable in extension settings if needed
4. [ ] Connect wallet
5. [ ] Test all key features:
   - [ ] Load dashboard
   - [ ] View vaults
   - [ ] Create withdrawal request
   - [ ] Approve withdrawal
   - [ ] Execute withdrawal
6. [ ] Check for console errors (F12 → Console)
7. [ ] Verify all UI elements load correctly
8. [ ] Test responsive design (resize window)

### 4.3 Test in Different Browser

**Install Alternative Browser:**
- **Chrome:** https://www.google.com/chrome/
- **Firefox:** https://www.mozilla.org/firefox/
- **Safari:** Built-in on macOS
- **Edge:** https://www.microsoft.com/edge/

**Steps:**
1. [ ] Install different browser
2. [ ] Install wallet extension (Phantom/Solflare) in new browser
3. [ ] Navigate to app URL
4. [ ] Connect wallet
5. [ ] Run full test suite:
   - [ ] **Navigation:** All pages load correctly
   - [ ] **Wallet Connection:** Connects without errors
   - [ ] **Vault Display:** Vaults load and display correctly
   - [ ] **Forms:** All forms work (create vault, request withdrawal)
   - [ ] **Transactions:** Transactions submit successfully
   - [ ] **UI Components:** Buttons, modals, cards render correctly
   - [ ] **Responsive Design:** Works on different window sizes
6. [ ] Check browser console for errors
7. [ ] Test with browser DevTools open (simulate mobile view)
8. [ ] Verify wallet interactions work (signing transactions)

### 4.4 Test on Different Device (Optional)

**Mobile Testing:**
1. [ ] Ensure app is accessible on local network
   - Update `next.config.ts` if needed
   - Or deploy to public URL (Vercel, Netlify)
2. [ ] Find your computer's local IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Example: 192.168.1.100
   ```
3. [ ] On mobile device, navigate to: `http://192.168.1.100:3000`
4. [ ] Install mobile wallet (Phantom mobile app)
5. [ ] Test key features on mobile
6. [ ] Check responsive design

**Tablet Testing:**
- Similar to mobile, test on tablet device
- Verify touch interactions work
- Check layout at tablet screen sizes

### 4.5 Create Fresh Browser Profile

**Chrome:**
1. Open Chrome
2. Click profile icon → "Add"
3. Create new profile
4. Install extensions fresh
5. Test app in new profile

**Firefox:**
1. Open Firefox
2. `about:profiles` in address bar
3. Create new profile
4. Install extensions
5. Test app

**This simulates:** A completely new user with no cached data, cookies, or extensions.

### 4.6 Test Checklist for New Browser

**Functional Tests:**
- [ ] App loads without errors
- [ ] Wallet connects successfully
- [ ] All pages are accessible
- [ ] Forms submit correctly
- [ ] Transactions execute successfully
- [ ] Data displays correctly (vaults, withdrawals, etc.)
- [ ] Navigation works (back/forward buttons)
- [ ] Links work correctly

**UI/UX Tests:**
- [ ] All components render correctly
- [ ] Colors, fonts, spacing look correct
- [ ] Buttons are clickable
- [ ] Modals/dialogs open and close
- [ ] Loading states appear
- [ ] Error messages display correctly
- [ ] Success notifications appear

**Performance Tests:**
- [ ] Page loads quickly (< 3 seconds)
- [ ] No lag when interacting with UI
- [ ] Transactions process in reasonable time
- [ ] No memory leaks (check task manager)

**Compatibility Tests:**
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge (if applicable)
- [ ] Works on mobile (responsive)

---

## ✅ Phase 5: Verification & Documentation

### 5.1 Document Test Results

**Create Test Report:**
```markdown
# Browser Compatibility Test Report

**Date:** [Date]
**App Version:** [Version]
**Tested By:** [Your Name]

## Browsers Tested:
- [ ] Chrome (Version: ___)
- [ ] Firefox (Version: ___)
- [ ] Safari (Version: ___)
- [ ] Edge (Version: ___)

## Test Results:
- [ ] All features work in Chrome
- [ ] All features work in Firefox
- [ ] All features work in Safari
- [ ] All features work in Edge

## Issues Found:
1. [Issue description]
   - Browser: ___
   - Severity: Critical/High/Medium/Low
   - Status: Fixed/Pending

## Notes:
[Any additional observations]
```

### 5.2 Fix Any Issues Found

**Common Issues & Fixes:**

**Issue: Wallet doesn't connect in incognito**
- **Fix:** Enable extension in incognito mode (Chrome: Extension settings → Allow in incognito)

**Issue: Styles look different in different browser**
- **Fix:** Check CSS vendor prefixes, test Tailwind classes

**Issue: Transactions fail in different browser**
- **Fix:** Check RPC endpoint, network configuration

**Issue: Console errors in new browser**
- **Fix:** Review errors, check browser compatibility, update dependencies

### 5.3 Final Verification

**Before Considering Complete:**
- [ ] Demo video recorded successfully
- [ ] Demo video reviewed and approved
- [ ] App tested in at least 2 different browsers
- [ ] All critical features work in all tested browsers
- [ ] No critical bugs found
- [ ] Test report documented
- [ ] Issues fixed (if any)

---

## 🚀 Quick Start Commands

### Start Everything for Demo:
```bash
# Terminal 1: Start Solana validator
solana-test-validator --reset

# Terminal 2: Deploy program (if needed)
cd /Users/apple/RustroverProjects/SME-vault
anchor deploy

# Terminal 3: Start Next.js app
cd /Users/apple/RustroverProjects/SME-vault/app
npm run dev
```

### Test in New Browser (Quick):
1. Open incognito window: `Cmd + Shift + N`
2. Navigate to: `http://localhost:3000`
3. Install wallet extension
4. Connect wallet
5. Test key features

---

## 📝 Notes

- **Recording Duration:** Complete feature walkthrough ~10-15 minutes; can edit into shorter segments
- **File Size:** 1080p recording ~100-200MB per minute (plan storage accordingly)
  - 15-minute recording: ~1.5-3GB
  - Consider recording in sections if storage is limited
- **Sharing:** Upload to YouTube (unlisted), Vimeo, or Google Drive for sharing
- **Backup:** Keep original recording file before editing
- **Editing Tips:**
  - You can create separate videos for each feature
  - Or create one long video with chapter markers
  - Add text overlays for feature names
  - Speed up transaction waiting times (time-lapse)

---

## 🆘 Troubleshooting

### Recording Issues:
- **Poor audio quality:** Check microphone settings, reduce background noise
- **Large file size:** Reduce resolution or use compression
- **Lag during recording:** Close other applications, reduce recording quality

### Testing Issues:
- **App doesn't load in new browser:** Check if dev server is running, verify URL
- **Wallet won't connect:** Ensure extension is installed and enabled
- **Transactions fail:** Verify network (localnet/devnet), check wallet has SOL
- **Styles broken:** Clear browser cache, check CSS loading

---

**Last Updated:** [Current Date]
**Status:** Ready for Use

# 🔧 RainbowKit Modal Centering Fix

## Issues Identified

### 1. **RainbowKit Modal Hidden on Left Side**
**Problem:** Modal appears on the left edge instead of centered on screen

**Root Cause:** CSS positioning conflicts with RainbowKit's default portal positioning

**Solution Applied:**
```css
/* Fix RainbowKit modal centering - target the portal container */
body > div[data-rk] {
  position: fixed !important;
  inset: 0 !important;
  z-index: 9999 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  pointer-events: none !important;
}

/* Allow clicks on the modal content */
body > div[data-rk] > * {
  pointer-events: auto !important;
}
```

### 2. **MetaMask Loading But Not Showing Popup**
**Possible Causes:**
1. Browser popup blocker
2. MetaMask extension not installed
3. Network mismatch
4. WalletConnect configuration issue

**Troubleshooting Steps:**

#### A. Check Browser Console
Open DevTools (F12) and look for:
- ❌ "MetaMask not installed"
- ❌ "User rejected request"
- ❌ "Network mismatch"
- ❌ WalletConnect errors

#### B. Verify MetaMask Installation
1. Check if MetaMask extension is installed
2. Make sure MetaMask is unlocked
3. Check if popup blocker is disabled

#### C. Check Network Configuration
1. Open MetaMask
2. Click network dropdown
3. Add Lisk Sepolia network manually if needed:
   - **Network Name:** Lisk Sepolia Testnet
   - **RPC URL:** https://rpc.sepolia-api.lisk.com
   - **Chain ID:** 4202
   - **Currency Symbol:** ETH
   - **Block Explorer:** https://sepolia-blockscout.lisk.com

#### D. Clear Browser Cache
1. Close all browser tabs
2. Clear cache and cookies
3. Restart browser
4. Try connecting again

#### E. Check WalletConnect Project ID
Current ID in `.env`: `f8fc66aef70efafe5c553752d3d4e236`

If this doesn't work, get a new one from:
https://cloud.walletconnect.com/

---

## Files Modified

- ✅ `src/index.css` - Added RainbowKit centering CSS

---

## Testing Steps

### Test Modal Centering:
1. Open http://localhost:8081/
2. Click "Connect Wallet" button
3. ✅ Modal should appear **centered** on screen
4. ✅ Backdrop should cover entire screen
5. ✅ Modal should be clickable

### Test MetaMask Connection:
1. Click "Connect Wallet"
2. Select "MetaMask"
3. ✅ MetaMask popup should appear
4. ✅ Should show Lisk Sepolia network
5. Click "Connect"
6. ✅ Wallet should connect successfully

---

## Additional Debugging

### If Modal Still Not Centered:
1. Open DevTools (F12)
2. Inspect the `div[data-rk]` element
3. Check computed styles
4. Look for conflicting CSS rules
5. Try adding `!important` to more specific selectors

### If MetaMask Still Not Appearing:
1. **Check Console Logs:**
   ```javascript
   // Look for these errors:
   - "MetaMask is not installed"
   - "User rejected the request"
   - "Unsupported chain"
   ```

2. **Try Different Wallet:**
   - Click "Connect Wallet"
   - Try "WalletConnect" instead
   - Scan QR code with mobile wallet

3. **Check MetaMask Settings:**
   - Open MetaMask
   - Settings → Advanced
   - Enable "Show test networks"
   - Add Lisk Sepolia manually

4. **Restart Everything:**
   ```bash
   # Stop dev server
   Ctrl+C
   
   # Clear node_modules cache
   rm -rf node_modules/.vite
   
   # Restart
   npm run dev
   ```

---

## Quick Fix Commands

```bash
# If you need to restart the dev server:
cd nullshotchess-frontend
npm run dev

# If you need to clear cache:
rm -rf node_modules/.vite
npm run dev

# If you need to reinstall dependencies:
rm -rf node_modules
npm install
npm run dev
```

---

## Status

- ✅ **Modal Centering CSS:** FIXED
- ⏳ **MetaMask Connection:** NEEDS TESTING

**Next Steps:**
1. Test the modal centering in browser
2. Check browser console for MetaMask errors
3. Verify MetaMask extension is installed and unlocked
4. Add Lisk Sepolia network to MetaMask if needed
5. Report any console errors for further debugging


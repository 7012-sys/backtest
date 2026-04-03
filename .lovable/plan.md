

## Plan: Fix Production Issues — Pro State Flicker, Mobile Dropdowns, Trading Calendar, Stock Count

### Summary

Four distinct issues to fix: (1) Pro users see Free UI flash on login/navigation, (2) mobile dropdown scroll bugs, (3) invalid trading dates shown, (4) stock count mismatch between marketing and app.

---

### Issue 1: Pro User State Delay & Flicker

**Root cause**: Every page independently fetches subscription status via `useUsageLimits` or `useSubscription`, causing a loading period where `isPro=false` renders Free UI.

**Fix**:

1. **Create `AuthProvider` context** (`src/contexts/AuthContext.tsx`)
   - Wrap the app in `<AuthProvider>` in `App.tsx`
   - On mount: fetch session, subscription, and admin role in parallel
   - Expose `{ user, isPro, isAdmin, isLoading, subscription, expiryDate, signOut }` via context
   - Cache subscription in `sessionStorage` — use cached value as initial state for instant render, then validate in background
   - Listen to `onAuthStateChange` to keep state in sync

2. **Add blocking full-screen loader**
   - In `AppLayout`, if auth context `isLoading` is true, show full-screen branded loader (already exists — just connect to context)
   - No Pro/Free UI renders until status is resolved

3. **Refactor consumers**
   - `Dashboard.tsx`: use context instead of local auth + subscription fetching
   - `AppHeader.tsx`: use context instead of `useSubscription`
   - `useUsageLimits`: accept pre-resolved `isPro`/`isAdmin` from context to skip redundant subscription queries
   - Other pages already using `useUsageLimits` will benefit automatically

**Result**: Single fetch on login, cached across navigation, no flicker.

---

### Issue 2: Mobile Dropdown UX Bug

**Root cause**: Radix Select on mobile can trigger scroll-to-top due to focus management and body scroll lock conflicts.

**Fix**:

1. **Update `SelectContent`** in `src/components/ui/select.tsx`:
   - Add `onCloseAutoFocus={(e) => e.preventDefault()}` to prevent scroll jump on close
   - Add `position="popper"` with `sideOffset={4}` for stable anchoring
   - Increase touch target: add `min-h-[44px]` to `SelectItem` for mobile tap friendliness

2. **Add global CSS** to prevent body scroll lock issues:
   ```css
   [data-radix-select-viewport] { -webkit-overflow-scrolling: touch; }
   ```

---

### Issue 3: Invalid Trading Data & Date Selection

**Fix**:

1. **Create utility** `src/lib/tradingCalendar.ts`:
   - `isTradingDay(date)`: returns false for weekends + Indian market holidays (NSE holiday list for 2024-2026)
   - `isDateSelectable(date)`: returns false for non-trading days AND today (incomplete data)
   - `getLastTradingDay()`: returns the most recent completed trading day

2. **Update `BacktestRunner.tsx`**:
   - Default end date = `getLastTradingDay()` instead of `TODAY`
   - Add `min`/`max` attributes on date inputs
   - Add validation before running backtest: if selected dates include non-trading days, show warning
   - Disable today's date in the date picker

3. **Add backend validation** in `fetch-market-data/index.ts`:
   - Validate that `endDate` is not today or a future date
   - Return clear error if date range is invalid

---

### Issue 4: Stock Count Mismatch

**Root cause**: Backend `SYMBOL_MAP` has 27 symbols, but frontend `ALL_DATASETS` in `BacktestRunner.tsx` only lists 11.

**Fix**:

1. **Expand `ALL_DATASETS`** in `BacktestRunner.tsx` to include all 27 symbols from the backend:
   - Add: NIFTYIT, NIFTYMIDCAP, ICICIBANK, HINDUNILVR, BHARTIARTL, KOTAKBANK, LT, AXISBANK, ASIANPAINT, MARUTI, TITAN, BAJFINANCE, WIPRO, ULTRACEMCO, NESTLEIND, SUNPHARMA

2. **Update marketing copy** across:
   - `PricingSection.tsx`: "25+ Indian Stock Symbols" (accurate)
   - `Upgrade.tsx`: same update in features list and comparison table

---

### Files to Create
- `src/contexts/AuthContext.tsx` — centralized auth + subscription context
- `src/lib/tradingCalendar.ts` — trading day validation utility

### Files to Modify
- `src/App.tsx` — wrap with AuthProvider
- `src/components/layout/AppLayout.tsx` — use auth context for loading
- `src/components/layout/AppHeader.tsx` — use auth context
- `src/pages/Dashboard.tsx` — use auth context, remove local subscription fetch
- `src/hooks/useUsageLimits.ts` — skip redundant subscription fetch when context available
- `src/components/ui/select.tsx` — mobile dropdown fixes
- `src/pages/BacktestRunner.tsx` — expand stock list, add date validation
- `src/components/landing/PricingSection.tsx` — update stock count
- `src/pages/Upgrade.tsx` — update stock count
- `supabase/functions/fetch-market-data/index.ts` — add date validation
- `src/index.css` — mobile touch scrolling fix


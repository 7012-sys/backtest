

# Application Refinement Plan

## 1. Remove Onboarding

**What changes:**
- Remove the onboarding redirect check from `src/pages/Dashboard.tsx` (the `checkUserAccess` function currently redirects to `/onboarding` if `onboarding_completed` is false)
- Remove the `/onboarding` route from `src/App.tsx`
- After login, users land directly on the dashboard
- The `Onboarding.tsx` page file will remain but be unreachable (no route)

**Files to modify:**
- `src/pages/Dashboard.tsx` -- Remove the onboarding check logic
- `src/App.tsx` -- Remove the `/onboarding` route

---

## 2. Watch Demo (Public Page)

**What changes:**
- Create a new public page at `/demo` (`src/pages/Demo.tsx`)
- Update the "Watch Demo" button in `src/components/landing/HeroSection.tsx` to navigate to `/demo`
- Add the `/demo` route to `src/App.tsx`

**Demo page sections:**
1. What is TradeTest? -- Overview explanation
2. How to Create Manual Strategy -- Step-by-step with SMA 50/200 crossover example, using existing UI card components to simulate screenshots
3. How to Create AI Strategy -- Example input "Buy when RSI below 30 and price above 200 SMA", show how AI converts to rules
4. How to Run Backtest -- Select dataset, configure capital, add commission, click run
5. Backtest Results Demo -- Simulated equity curve, monthly returns grid, trade list preview, key metrics cards, confidence score, walk-forward preview

The page will use existing UI components (Card, Badge, etc.) to create realistic-looking mock screenshots. No login required.

**Files to create:**
- `src/pages/Demo.tsx`

**Files to modify:**
- `src/components/landing/HeroSection.tsx` -- Wire "Watch Demo" button to `/demo`
- `src/App.tsx` -- Add `/demo` route

---

## 3. Premium Expiry Display + Auto Downgrade

**What changes:**
- Dashboard already shows expiry date. Will ensure it uses the real `current_period_end` from the subscription table.
- Add an auto-downgrade check: when the dashboard loads, if the subscription has expired (`current_period_end < now()`), automatically update the subscription to `plan: 'free'` and `status: 'active'` in the database.
- This ensures expired premium users are immediately downgraded without manual intervention.

**Files to modify:**
- `src/pages/Dashboard.tsx` -- Add expiry check logic in `fetchSubscription` that auto-downgrades expired subscriptions

---

## 4. Data Library Page Fixes

**What changes:**
- Remove the duplicate `<ThemeToggle />` from the `AppHeader` rightContent prop in `DataLibrary.tsx`
- Use `AppLayout` component (which already includes AppHeader with back navigation) instead of manually rendering `AppHeader` + `AppFooter`

**Files to modify:**
- `src/pages/DataLibrary.tsx` -- Switch to `AppLayout` with `showBack`, `backTo="/dashboard"`, remove standalone `ThemeToggle`

---

## 5. Remove Column Validation UI

**What changes:**
- In `CSVUploader.tsx`: Remove the manual column mapping UI (the grid of Date/Open/High/Low/Close/Volume dropdowns and "Validate & Load Data" button). Instead, after file selection, automatically detect columns and validate+load immediately. If required columns are missing, show an error message.
- In `DataLibrary.tsx`: Same approach -- remove the column mapping grid from the upload form. Auto-detect and save directly after file selection.

**Files to modify:**
- `src/components/backtest/CSVUploader.tsx` -- Auto-validate on file upload, remove column mapping UI
- `src/pages/DataLibrary.tsx` -- Remove column mapping UI from upload form, auto-detect and save

---

## 6. Date Range Auto-Fill (CSV Upload Bug)

**What changes:**
- Currently, `CSVUploader` only calls `onDateRangeDetected` after the user clicks "Validate & Load Data". With the column mapping UI removed (item 5), auto-validation will happen immediately on file upload, which will automatically detect and set the date range.
- This fix is inherently resolved by item 5's changes.

---

## 7. 6-Month Range Error Fix

**What changes:**
- In `BacktestRunner.tsx`, change the minimum data points check from 30 to a lower number (e.g., 5), and change the error message. If the strategy produces zero trades, show "No Trades Generated for Selected Date Range" instead of blocking execution.
- The backtest engine already returns `totalTrades: 0` when no trades are generated -- the issue is the `priceData.length < 30` check blocking execution before the engine runs.

**Files to modify:**
- `src/pages/BacktestRunner.tsx` -- Lower the minimum data points threshold and improve error messaging

---

## 8. Data Range Reset Bug

**What changes:**
- In `BacktestRunner.tsx`, when switching from CSV to preloaded dataset (or changing dataset), reset `startDate`/`endDate` to the new dataset's bounds and clear CSV-related state.
- The existing `onClick` for the "Preloaded Dataset" button already clears CSV state but doesn't reset dates to the preloaded dataset's range. Will fix this.

**Files to modify:**
- `src/pages/BacktestRunner.tsx` -- Reset date range when switching data source mode or changing preloaded dataset

---

## Technical Summary

| # | Change | Files |
|---|--------|-------|
| 1 | Remove onboarding | `Dashboard.tsx`, `App.tsx` |
| 2 | Demo page | `Demo.tsx` (new), `HeroSection.tsx`, `App.tsx` |
| 3 | Auto-downgrade | `Dashboard.tsx` |
| 4 | Data Library layout fix | `DataLibrary.tsx` |
| 5 | Remove column mapping UI | `CSVUploader.tsx`, `DataLibrary.tsx` |
| 6 | Date auto-fill | Resolved by #5 |
| 7 | 6-month range fix | `BacktestRunner.tsx` |
| 8 | Date range reset | `BacktestRunner.tsx` |


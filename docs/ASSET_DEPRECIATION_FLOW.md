# Fixed Asset Depreciation Flow

## Overview

The Fixed Assets module tracks capital assets and automatically calculates depreciation using Straight Line or Declining Balance methods.

---

## Depreciation Methods

### 1. Straight Line Depreciation

**Formula**: `(Cost - Salvage Value) / Useful Life`

**Example**:
- Cost: $100,000
- Salvage Value: $10,000
- Useful Life: 10 years
- Annual Depreciation: ($100,000 - $10,000) / 10 = $9,000/year

**Code Location**: `backend/src/services/fixedAssetService.js`

```javascript
calculateStraightLine(cost, salvageValue, usefulLife) {
  return (cost - salvageValue) / usefulLife;
}
```

### 2. Declining Balance Depreciation

**Formula**: `Book Value × Depreciation Rate`

**Depreciation Rate**: `2 / Useful Life` (200% declining balance)

**Example**:
- Cost: $100,000
- Useful Life: 10 years
- Rate: 2 / 10 = 20%
- Year 1: $100,000 × 20% = $20,000
- Year 2: ($100,000 - $20,000) × 20% = $16,000
- Year 3: ($80,000 - $16,000) × 20% = $12,800
- ...continues until salvage value

**Code Location**: `backend/src/services/fixedAssetService.js`

```javascript
calculateDecliningBalance(bookValue, rate, salvageValue) {
  const depreciation = bookValue * rate;
  // Don't depreciate below salvage value
  return Math.max(depreciation, bookValue - salvageValue);
}
```

---

## Asset Lifecycle

### 1. Asset Acquisition

```javascript
{
  name: "Office Building",
  description: "Main office building",
  category: "BUILDING",
  acquisitionDate: "2024-01-01",
  cost: 1000000,
  depreciationMethod: "STRAIGHT_LINE",
  usefulLife: 20, // years
  salvageValue: 100000,
  depreciationAccountId: "acc123", // Depreciation Expense account
  accumulatedDepreciationAccountId: "acc456" // Accumulated Depreciation account
}
```

### 2. Depreciation Calculation

**Location**: `backend/src/controllers/fixedAssetController.js` → `calculateDepreciation()`

```javascript
// Calculate depreciation as of a specific date
const depreciation = await calculateDepreciation(assetId, {
  asOfDate: "2024-12-31"
});

// Returns:
{
  annualDepreciation: 45000,
  monthlyDepreciation: 3750,
  accumulatedDepreciation: 45000,
  bookValue: 955000,
  remainingLife: 19
}
```

### 3. Posting Depreciation

When depreciation is posted, journal entries are created:

```
DEBIT  Depreciation Expense           $45,000.00
CREDIT Accumulated Depreciation       $45,000.00
```

**Location**: `backend/src/services/accountingEngine.js` → `createDepreciationEntry()`

### 4. Asset Disposal

When an asset is disposed:

```javascript
{
  disposalDate: "2024-12-31",
  disposalAmount: 900000,
  disposalMethod: "SALE",
  disposalAccountId: "acc789", // Cash/Bank account
  gainLossAccountId: "acc101" // Gain/Loss on Disposal account
}
```

**Journal Entries**:
```
DEBIT  Cash/Bank                    $900,000.00
DEBIT  Accumulated Depreciation     $450,000.00
DEBIT  Loss on Disposal             $50,000.00
CREDIT Fixed Asset                  $1,000,000.00
```

If sold for more than book value:
```
DEBIT  Cash/Bank                    $1,000,000.00
DEBIT  Accumulated Depreciation     $450,000.00
CREDIT Fixed Asset                  $1,000,000.00
CREDIT Gain on Disposal             $450,000.00
```

---

## Depreciation Schedule

**Endpoint**: `GET /api/fixed-assets/:id/depreciation-schedule`

Returns annual depreciation for the asset's useful life:

```javascript
[
  {
    year: 1,
    beginningBookValue: 1000000,
    depreciation: 45000,
    accumulatedDepreciation: 45000,
    endingBookValue: 955000
  },
  {
    year: 2,
    beginningBookValue: 955000,
    depreciation: 45000,
    accumulatedDepreciation: 90000,
    endingBookValue: 910000
  },
  // ... continues for useful life
]
```

---

## Asset Status

- **ACTIVE**: Asset in use, depreciating
- **DISPOSED**: Asset sold/disposed, no longer depreciating
- **FULLY_DEPRECIATED**: Reached salvage value

---

## API Endpoints

### Create Asset
```
POST /api/fixed-assets
```

### Calculate Depreciation
```
POST /api/fixed-assets/:id/calculate-depreciation
Body: { asOfDate?: "2024-12-31" }
```

### Post Depreciation
```
POST /api/fixed-assets/:id/post-depreciation
Body: { asOfDate?: "2024-12-31", amount: 45000 }
```

### Dispose Asset
```
POST /api/fixed-assets/:id/dispose
Body: {
  disposalDate: "2024-12-31",
  disposalAmount: 900000,
  disposalMethod: "SALE",
  disposalAccountId: "acc123",
  gainLossAccountId: "acc456"
}
```

### Get Depreciation Schedule
```
GET /api/fixed-assets/:id/depreciation-schedule
```

---

## Testing

### Unit Tests

```javascript
describe('Depreciation Calculations', () => {
  it('should calculate straight line correctly', () => {
    const cost = 100000;
    const salvage = 10000;
    const life = 10;
    const depreciation = calculateStraightLine(cost, salvage, life);
    expect(depreciation).toBe(9000);
  });

  it('should calculate declining balance correctly', () => {
    const bookValue = 100000;
    const rate = 0.20;
    const depreciation = calculateDecliningBalance(bookValue, rate, 0);
    expect(depreciation).toBe(20000);
  });
});
```

---

## Common Issues

### Issue: "Depreciation not calculating"
**Solution**: Ensure asset has valid depreciation method, useful life, and accounts assigned.

### Issue: "Cannot post depreciation"
**Solution**: Check that depreciation and accumulated depreciation accounts exist in Chart of Accounts.

### Issue: "Book value incorrect"
**Solution**: Verify all depreciation entries have been posted. Check for missing depreciation periods.

---

## Related Documentation

- `ACCOUNTING_ENGINE.md` - How depreciation posts to ledger
- Chart of Accounts setup for depreciation accounts





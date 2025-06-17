# API Types Update Summary

## Changes Made to `/workspaces/miowsis/frontend/src/services/api/types.ts`

### 1. ChatResponse Type
**Issue**: Missing 'response' and 'context' properties
**Fix Applied**:
```typescript
export interface ChatResponse {
  id?: string;
  message: string;
  response: string;  // Added
  conversationId: string;
  timestamp: string;
  suggestions?: string[];
  context?: Record<string, any>;  // Added
}
```

### 2. TransactionDto Type
**Issue**: Missing properties like 'transactionDate', 'securityName', 'description', 'amount', 'esgScore'
**Fix Applied**:
```typescript
export interface TransactionDto {
  id: string;
  portfolioId: string;
  symbol: string;
  securityName?: string;  // Added
  description?: string;  // Added
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'ROUND_UP' | 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'RECURRING';  // Expanded
  quantity?: number;  // Made optional
  price?: number;  // Made optional
  amount: number;  // Added
  totalAmount?: number;  // Made optional
  fees?: number;  // Made optional
  esgScore?: number;  // Added
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  transactionDate: string;  // Added
  executedAt?: string;
  createdAt: string;
}
```

### 3. SellOrderRequest Type
**Issue**: Missing support for STOP_LOSS orderType
**Fix Applied**:
```typescript
export interface SellOrderRequest {
  symbol: string;
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';  // Added STOP_LOSS
  limitPrice?: number;
  stopPrice?: number;  // Added
}
```

### 4. RebalanceRequest Type
**Issue**: Property name mismatch (targetAllocations vs targetAllocation)
**Fix Applied**:
```typescript
export interface RebalanceRequest {
  targetAllocation: Array<{  // Changed from targetAllocations
    symbol: string;
    percentage: number;
  }>;
  executionType?: 'IMMEDIATE' | 'GRADUAL';  // Made optional
}
```

### 5. RebalanceResultDto Type
**Issue**: Missing/incorrect properties based on actual API response
**Fix Applied**:
```typescript
export interface RebalanceResultDto {
  currentAllocation: Array<{  // Added
    symbol: string;
    percentage: number;
  }>;
  targetAllocation: Array<{  // Added
    symbol: string;
    percentage: number;
  }>;
  transactions: Array<{  // Added
    type: 'BUY' | 'SELL';
    symbol: string;
    quantity: number;
    estimatedPrice: number;
  }>;
  estimatedCost: number;  // Added
  adjustments?: Array<{  // Made optional (kept for backward compatibility)
    symbol: string;
    currentPercentage: number;
    targetPercentage: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    quantity: number;
    estimatedCost: number;
  }>;
  totalCost?: number;  // Made optional
  estimatedFees?: number;  // Made optional
}
```

### Additional Types Updated

#### HoldingDto
Added missing properties used in the UI:
- `securityName?: string`
- `currentValue?: number`
- `totalCost?: number`
- `esgScore?: number`

#### PortfolioAllocationDto
Added missing property:
- `sectorBreakdown?: Array<{ name: string; percentage: number; }>`

## Test Files Updated

- `/workspaces/miowsis/frontend/src/__tests__/integration/portfolio/portfolioOperations.test.ts`
  - Updated `targetAllocations` to `targetAllocation` in rebalance requests
  - Removed references to non-existent properties like `simulationOnly`
  - Updated round-up request to use correct property names

## Notes

- The types now match the actual API responses as documented in the mock handlers and backend API documentation
- Some properties were made optional to handle cases where they might not be present
- The changes ensure type safety while maintaining backward compatibility where possible
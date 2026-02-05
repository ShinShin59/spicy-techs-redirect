# Test Suite Documentation

This directory contains comprehensive tests for the Spicy Techs application, covering all critical functionality and edge cases.

## Test Structure

Tests are organized by feature area:

- **Store Tests** (`src/store/__tests__/`): State management, persistence, and data operations
- **Utils Tests** (`src/utils/__tests__/`): Utility functions for calculations and data processing

## Test Coverage

### 1. Build State Persistence and Recovery
Tests build save/load functionality, dual-base factions, and localStorage error handling.

### 2. Knowledge Rate Calculation Accuracy
Verifies knowledge/day calculations including all modifiers, category bonuses, and clamping.

### 3. Development Cost Calculation
Tests the geometric progression formula for research costs and order dependencies.

### 4. Build Sharing URL Encoding/Decoding
Tests URL compression, encoding/decoding, and error handling for shared builds.

### 5. Faction Switching and State Isolation
Verifies faction state preservation and isolation when switching between factions.

### 6. Main Base Building Operations
Tests building placement, removal, order tracking, and dual-base operations.

### 7. Unit and Gear Slot Management
Tests unit slots, hero slot handling, gear assignment, and slot limits.

### 8. Development Selection and Ordering
Tests development selection, reordering, summary calculation, and knowledge overrides.

### 9. Build Snapshot and Change Detection
Tests snapshot creation, comparison, and unsaved change detection.

### 10. Data Migration and Normalization
Tests legacy format handling, optional field defaults, and data normalization.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Setup

Tests use:
- **Vitest** as the test runner
- **jsdom** for DOM simulation
- **@testing-library/react** for React component testing (when needed)

The test setup file (`src/test/setup.ts`) configures:
- localStorage mocking
- window.location mocking
- crypto.randomUUID fallback

## Writing New Tests

When adding new tests:

1. Place tests in the appropriate `__tests__` directory
2. Follow the naming convention: `*.test.ts`
3. Use descriptive test names that explain what is being tested
4. Include edge cases and error scenarios
5. Mock external dependencies appropriately

## Test Best Practices

- Each test should be independent and not rely on other tests
- Use `beforeEach` to reset state between tests
- Test both happy paths and error cases
- Verify state changes explicitly
- Test edge cases (empty arrays, null values, boundary conditions)

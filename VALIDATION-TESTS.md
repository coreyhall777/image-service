# Environment Variable Validation Tests

This document describes manual tests to verify environment variable parsing is robust.

## Prerequisites

```bash
npm run build
```

## Test Cases

### 1. Valid PORT Values

```powershell
# Valid port 8080
$env:PORT=8080; node dist/server.js
# Expected: Server starts successfully on port 8080

# Valid port 65535 (maximum)
$env:PORT=65535; node dist/server.js
# Expected: Server starts successfully on port 65535

# Valid port 1 (minimum)
$env:PORT=1; node dist/server.js
# Expected: Server starts successfully on port 1 (requires admin privileges)
```

### 2. Invalid PORT Values (Should Reject)

```powershell
# Empty PORT
$env:PORT=""; node dist/server.js
# Expected: Error - "Invalid PORT: empty string. Must be a positive integer."

# PORT with trailing characters
$env:PORT="3000junk"; node dist/server.js
# Expected: Error - "Invalid PORT: '3000junk'. Must be a positive integer with no extra characters."

# PORT=0
$env:PORT=0; node dist/server.js
# Expected: Error - "Invalid PORT: '0'. Must be greater than 0."

# PORT above maximum (65536)
$env:PORT=65536; node dist/server.js
# Expected: Error - "Invalid PORT: '65536'. Must be between 1 and 65535."

# PORT=100000
$env:PORT=100000; node dist/server.js
# Expected: Error - "Invalid PORT: '100000'. Must be between 1 and 65535."

# Negative PORT
$env:PORT=-1; node dist/server.js
# Expected: Error - "Invalid PORT: '-1'. Must be a positive integer with no extra characters."
```

### 3. Invalid REQUEST_TIMEOUT Values (Should Reject)

```powershell
# Empty REQUEST_TIMEOUT
$env:REQUEST_TIMEOUT=""; node dist/server.js
# Expected: Error - "Invalid REQUEST_TIMEOUT: empty string. Must be a positive integer."

# Scientific notation
$env:REQUEST_TIMEOUT="1e4"; node dist/server.js
# Expected: Error - "Invalid REQUEST_TIMEOUT: '1e4'. Must be a positive integer with no extra characters."

# Trailing unit
$env:REQUEST_TIMEOUT="10000ms"; node dist/server.js
# Expected: Error - "Invalid REQUEST_TIMEOUT: '10000ms'. Must be a positive integer with no extra characters."

# Zero timeout
$env:REQUEST_TIMEOUT=0; node dist/server.js
# Expected: Error - "Invalid REQUEST_TIMEOUT: '0'. Must be greater than 0."

# Partial parse prefix
$env:REQUEST_TIMEOUT="123abc"; node dist/server.js
# Expected: Error - "Invalid REQUEST_TIMEOUT: '123abc'. Must be a positive integer with no extra characters."
```

### 4. Invalid MAX_IMAGE_SIZE Values (Should Reject)

```powershell
# Empty MAX_IMAGE_SIZE
$env:MAX_IMAGE_SIZE=""; node dist/server.js
# Expected: Error - "Invalid MAX_IMAGE_SIZE: empty string. Must be a positive integer."

# Trailing suffix
$env:MAX_IMAGE_SIZE="5000000MB"; node dist/server.js
# Expected: Error - "Invalid MAX_IMAGE_SIZE: '5000000MB'. Must be a positive integer with no extra characters."

# Zero size
$env:MAX_IMAGE_SIZE=0; node dist/server.js
# Expected: Error - "Invalid MAX_IMAGE_SIZE: '0'. Must be greater than 0."

# Decimal value
$env:MAX_IMAGE_SIZE="10.5"; node dist/server.js
# Expected: Error - "Invalid MAX_IMAGE_SIZE: '10.5'. Must be a positive integer with no extra characters."
```

### 5. Valid Custom Configuration

```powershell
# All custom values
$env:PORT=8080; $env:MAX_IMAGE_SIZE=5242880; $env:REQUEST_TIMEOUT=15000; node dist/server.js
# Expected: Server starts successfully with custom configuration
```

### 6. Quick Validation Script

```powershell
# Test the helper script
$env:PORT=8080; $env:MAX_IMAGE_SIZE=5242880; $env:REQUEST_TIMEOUT=15000; node test-env.js
```

## Automated Tests

Run the comprehensive validation test suite:

```bash
npm test
```

This runs 28 tests including:
- Basic constant validation (8 tests)
- API endpoint tests (2 tests)
- Environment variable rejection tests (18 tests)
  - PORT validation (8 tests, including empty string)
  - REQUEST_TIMEOUT validation (5 tests, including empty string)
  - MAX_IMAGE_SIZE validation (4 tests, including empty string)
  - Safe integer validation (1 test)

## Key Validation Rules

1. **Undefined vs Empty**: `undefined` uses default; `''` (empty string) throws error
2. **Full String Validation**: Only pure integers accepted (regex: `^\d+$`)
3. **No Partial Parsing**: `parseInt("3000junk")` would give 3000, but we reject it
4. **Safe Integer Check**: Values must be within `Number.MAX_SAFE_INTEGER`
5. **Positive Values**: All values must be > 0
6. **PORT Range**: Must be between 1 and 65535 (TCP port range)
7. **Clear Error Messages**: Describes exactly what's wrong, no misleading "using default" message
8. **Cross-Platform Tests**: Validation tests use Node's `spawn` (not PowerShell-specific)

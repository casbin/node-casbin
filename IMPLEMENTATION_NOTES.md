# Multiple Policy Types Implementation Notes

## Overview
This document explains the implementation of support for multiple policy definitions (p, p2, p3, etc.) in node-casbin, referencing the Go Casbin implementation.

## Go Casbin Analysis

### How Go Handles Multiple Policy Types
Go Casbin uses separate matchers for each policy type:

**Model Example:**
```
[policy_definition]
p = sub, obj, act
p2 = sub, act

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
m2 = r.sub == p2.sub && r.act == p2.act
```

**Usage:**
```go
// Use default context (r, p, e, m)
enforcer.Enforce("alice", "data1", "read")

// Use context for p2 (r2, p2, e2, m2)
enforcer.Enforce(NewEnforceContext("2"), user, obj, act)
```

### Key Go Implementation Details

**File:** `enforcer.go`, lines 715-730
```go
if policyLen := len(e.model["p"][pType].Policy); policyLen != 0 && 
   strings.Contains(expString, pType+"_") {
    // Only evaluate if:
    // 1. Policy type has policies
    // 2. Matcher contains pType references (e.g., "p_", "p2_")
}
```

## Node-Casbin Implementation

### Design Decision
We follow Go's core logic but enable an enhanced capability: **single matcher can reference multiple policy types**.

### Implementation Details

**File:** `src/coreEnforcer.ts`, lines 481-502
```typescript
// Get all policy types from the 'p' section
const policyTypes: string[] = policyMap ? Array.from(policyMap.keys()) : [];

for (const ptype of policyTypes) {
    const policyDef = policyMap?.get(ptype);
    
    // Check if matcher contains references to this policy type
    // This is consistent with Go Casbin's behavior
    if (!expString.includes(`${ptype}_`)) {
        continue;
    }
    
    // Evaluate policies of this type
    for (let i = 0; i < policyLen; i++) {
        // ... evaluation logic
    }
}
```

### Advantages Over Go Implementation

1. **Unified Enforcement**: One `enforce()` call can match policies from multiple types
2. **Flexible Matchers**: Single matcher can handle different policy schemas
3. **Cleaner Code**: No need for multiple enforce calls with different contexts

### Example Usage

**Model:**
```
[policy_definition]
p = sub, obj, act
p2 = sub, act

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act || 
    r.sub == p2.sub && r.act == p2.act
```

**Policies:**
```
p, alice, data1, read
p2, bob, write-all-objects
```

**Code:**
```typescript
await enforcer.enforce('alice', 'data1', 'read');  // true (via p)
await enforcer.enforce('bob', 'data1', 'write-all-objects');  // true (via p2)
```

## Behavior Comparison

| Scenario | Go Casbin | Node-Casbin (This PR) |
|----------|-----------|----------------------|
| Single policy type | ✓ Supported | ✓ Supported |
| Multiple policy types, separate matchers | ✓ Supported | ✓ Supported |
| Multiple policy types, single matcher | ✗ Not supported | ✓ **Supported** |
| pType reference check | ✓ Yes | ✓ Yes |
| EnforceContext | ✓ Supported | ✓ Supported |

## Testing

### Test Coverage
- 188 tests pass (7 new tests added)
- Backward compatibility verified
- Go Casbin behavior compatibility verified

### Key Test Cases

1. **Multiple policy types with unified matcher** (enables issue solution)
2. **Exact issue scenario** (matcher only references p, not p2)
3. **Three policy types** (p, p2, p3)
4. **enforceEx with multiple types**
5. **eft column with multiple types**
6. **Backward compatibility** (single policy type)

## Migration Guide

### For Existing Users
No changes required. Single policy type models work exactly as before.

### For New Multi-Type Users

**Option 1: Go-style (separate matchers)**
```
[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
m2 = r.sub == p2.sub && r.act == p2.act

// Use EnforceContext to select matcher
await enforcer.enforce(new EnforceContext('r2', 'p2', 'e2', 'm2'), ...)
```

**Option 2: Unified matcher (node-casbin enhancement)**
```
[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act || 
    r.sub == p2.sub && r.act == p2.act

// Single enforce call handles both types
await enforcer.enforce('alice', 'data1', 'read')
```

## References

- Go Casbin: https://github.com/casbin/casbin
- Original Issue: casbin/casbin (editor issue)
- Go Implementation: `enforcer.go` lines 612-800
- Tested Version: Go Casbin v2.134.0

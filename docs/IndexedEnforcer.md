# Performance Optimization with IndexedEnforcer

## Overview

The `IndexedEnforcer` is an optimized version of the standard Casbin enforcer designed for scenarios with large numbers of policies, particularly when using RBAC with wildcard matching. It provides significant performance improvements by building and maintaining an index of policies grouped by subject.

## When to Use IndexedEnforcer

Use `IndexedEnforcer` when:
- You have a large number of policies (thousands or more)
- You're using RBAC with role-based access control
- Your matcher includes `g(r.sub, p.sub)` to check role membership
- You're experiencing slow enforcement performance

## Performance Improvement

Based on our benchmarks with ~4,200 policies:
- **Regular Enforcer**: 889ms for 10 enforcement checks
- **Indexed Enforcer**: 415ms for 10 enforcement checks
- **Improvement**: ~2.1x faster

With larger policy sets (40,000+ policies as mentioned in the original issue), the improvement should be even more significant.

## Usage

### Basic Usage

```typescript
import { newIndexedEnforcer } from 'casbin';

// Create an indexed enforcer (indexing is enabled by default)
const enforcer = await newIndexedEnforcer('model.conf', 'policy.csv');

// Use it just like a regular enforcer
const allowed = await enforcer.enforce('alice', '/data/1', 'read');
```

### Enabling Indexing on Existing Enforcer

You can also enable policy indexing on any existing enforcer:

```typescript
import { newEnforcer } from 'casbin';

const enforcer = await newEnforcer('model.conf', 'policy.csv');

// Enable policy indexing
enforcer.enableAutoBuildPolicyIndex(true);

// Rebuild the index
enforcer.buildPolicyIndex();
```

### Example Scenario (from GitHub Issue)

Here's how to use `IndexedEnforcer` for the scenario described in the GitHub issue:

**Model** (`model.conf`):
```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && keyMatch2(r.obj, p.obj) && r.act == p.act
```

**Policy** (`policy.csv`):
```csv
p, program-manager-438, /program/438, delete
p, program-manager-438, /program/438, read_mappings
p, program-manager-438, /audit/438/:auditId, create
p, program-manager-438, /audit/438/:auditId, delete_attachment
# ... thousands more policies ...

g, john, program-manager-438
```

**Code**:
```typescript
import { newIndexedEnforcer } from 'casbin';

const enforcer = await newIndexedEnforcer('model.conf', 'policy.csv');

// This will be significantly faster with IndexedEnforcer
const result = await enforcer.enforce('john', '/finding/438/33/44/3', 'read');
```

## How It Works

The `IndexedEnforcer` improves performance through the following mechanisms:

1. **Policy Indexing**: Builds an index that maps subjects (roles) to policy indices, allowing quick lookup of relevant policies
2. **Role Pre-fetching**: Before enforcement, it fetches all roles for the subject and determines which policies need to be checked
3. **Automatic Index Maintenance**: The index is automatically updated when policies are added, removed, or modified

## API Reference

### IndexedEnforcer

#### Constructor
```typescript
const enforcer = new IndexedEnforcer();
```
Creates a new indexed enforcer with policy indexing enabled by default.

#### Methods

All methods from the standard `Enforcer` are available, plus:

- `enableAutoBuildPolicyIndex(enable: boolean)`: Enable or disable automatic policy index building
- `buildPolicyIndex()`: Manually rebuild the policy index
- `getPolicyIndicesToCheck(subject: string, enforceContext: EnforceContext)`: Get the indices of policies to check for a given subject

## Performance Considerations

- **Index Building**: The index is built when policies are loaded and maintained automatically during policy modifications. This adds a small overhead during these operations but provides significant speedup during enforcement.
- **Memory Usage**: The index requires additional memory proportional to the number of unique subjects in your policies. For most scenarios, this is negligible.
- **Best Practices**:
  - Use `IndexedEnforcer` for large policy sets (1000+ policies)
  - Combine with result caching for repeated checks
  - Consider batching policy additions/removals to minimize index rebuilds

## Migration Guide

Migrating from `Enforcer` to `IndexedEnforcer` is straightforward:

**Before**:
```typescript
import { newEnforcer } from 'casbin';
const enforcer = await newEnforcer('model.conf', 'policy.csv');
```

**After**:
```typescript
import { newIndexedEnforcer } from 'casbin';
const enforcer = await newIndexedEnforcer('model.conf', 'policy.csv');
```

All existing code using the enforcer will continue to work without any changes.

## Limitations

- The optimization is most effective for RBAC models where the matcher includes `g(r.sub, p.sub)`
- For models without role-based access control, the performance benefit may be minimal
- Wildcard subjects in policies are not currently optimized and will fall back to checking all policies

## Related

- [CachedEnforcer](https://casbin.org/docs/en/management-api#cachedmanagement-api): For caching enforcement decisions
- [Performance](https://casbin.org/docs/en/performance): General Casbin performance optimization guide

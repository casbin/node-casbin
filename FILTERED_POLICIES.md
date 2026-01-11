# Using Filtered Policies in Web Frameworks

This guide explains how to effectively use Casbin's filtered policy feature in web applications with many users, where loading all policies into memory may not be practical.

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Usage Patterns](#usage-patterns)
- [API Reference](#api-reference)
- [Important Considerations](#important-considerations)
- [Examples](#examples)

## Overview

Casbin supports **filtered policies**, which allow you to load only a subset of policies from your storage into memory. This is particularly useful in multi-tenant applications or systems with millions of policies where you only need policies relevant to the current user, organization, or domain.

## The Problem

In web frameworks with many users, you typically face these challenges:

1. **Memory concerns**: Loading all policies for all users/organizations consumes significant memory
2. **Performance**: Searching through millions of policies can be slow
3. **Isolation**: Each request may only need policies for a specific user/organization/domain

## The Solution

Casbin provides two complementary approaches:

### 1. Shared Enforcer Pattern (Recommended for most cases)

Create a single shared enforcer instance that loads all policies:

```javascript
// At application startup
const sharedEnforcer = await newEnforcer(modelPath, adapter);
await sharedEnforcer.loadPolicy();

// In request handlers
app.use(async (req, res, next) => {
  const allowed = await sharedEnforcer.enforce(req.user, req.resource, req.action);
  if (!allowed) {
    return res.status(403).send('Forbidden');
  }
  next();
});
```

**Pros:**
- Simple and efficient
- One enforcer instance for entire application
- Fast enforcement checks
- Safe for policy modifications

**Use when:**
- You have thousands to hundreds of thousands of policies
- Policies fit comfortably in memory
- Need fast enforcement checks

### 2. Filtered Enforcer Pattern (For special cases)

Create filtered enforcers for specific contexts:

```javascript
const { newFilteredEnforcer } = require('casbin');

// Per-request filtered enforcer
app.use(async (req, res, next) => {
  const enforcer = await newFilteredEnforcer(
    modelPath,
    adapter,
    { p: ['', req.user.orgId], g: ['', '', req.user.orgId] }
  );
  
  // Use enforcer for this request
  const permissions = await enforcer.getPermissionsForUser(req.user.id);
  req.userPermissions = permissions;
  next();
});
```

**Filter Format Note:** The filter values match the policy definition fields. For a model with `p = sub, dom, obj, act`, use `filter.p = ['', 'domain1']` to filter by domain (empty string for sub, 'domain1' for domain). See API Reference for details.

**Pros:**
- Loads only relevant policies
- Reduces memory per request
- Good for multi-tenant isolation

**Use when:**
- You have millions of policies across many tenants
- Each tenant has a manageable number of policies
- Need to display user-specific permission lists
- Want strong tenant isolation

## Usage Patterns

### Pattern 1: Shared Enforcer for Enforcement

```javascript
// Initialization (once at startup)
const enforcer = await newEnforcer('model.conf', adapter);
await enforcer.loadPolicy();

// Share across all requests
app.locals.enforcer = enforcer;

// In route handlers
app.get('/data/:id', async (req, res) => {
  const allowed = await app.locals.enforcer.enforce(
    req.user.id,
    req.params.id,
    'read'
  );
  
  if (!allowed) {
    return res.status(403).send('Access denied');
  }
  
  // Serve the data
  res.json({ data: await getData(req.params.id) });
});

// For policy modifications
app.post('/admin/policies', async (req, res) => {
  await app.locals.enforcer.addPolicy(
    req.body.user,
    req.body.resource,
    req.body.action
  );
  res.send('Policy added');
});
```

### Pattern 2: Filtered Enforcer for User Permission Views

```javascript
const { newFilteredEnforcer } = require('casbin');

// Get user's permissions for display
app.get('/my-permissions', async (req, res) => {
  const enforcer = await newFilteredEnforcer(
    'model.conf',
    adapter,
    { p: [req.user.orgId], g: [req.user.orgId] }
  );
  
  const permissions = await enforcer.getPermissionsForUser(req.user.id);
  const roles = await enforcer.getRolesForUser(req.user.id);
  
  res.json({ permissions, roles });
});
```

### Pattern 3: Cached Filtered Enforcers

```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getOrgEnforcer(orgId) {
  const cached = cache.get(orgId);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.enforcer;
  }
  
  const enforcer = await newFilteredEnforcer(
    'model.conf',
    adapter,
    { p: [orgId], g: [orgId] }
  );
  
  cache.set(orgId, {
    enforcer,
    timestamp: Date.now()
  });
  
  return enforcer;
}

// Usage
app.use(async (req, res, next) => {
  req.orgEnforcer = await getOrgEnforcer(req.user.orgId);
  next();
});
```

### Pattern 4: Hybrid Approach

```javascript
// Shared enforcer for enforcement checks
const sharedEnforcer = await newEnforcer('model.conf', adapter);
await sharedEnforcer.loadPolicy();

// Helper to get filtered view for user
async function getUserPermissionView(userId, orgId) {
  const filteredEnforcer = await newFilteredEnforcer(
    'model.conf',
    adapter,
    { p: [orgId], g: [orgId] }
  );
  
  return {
    permissions: await filteredEnforcer.getPermissionsForUser(userId),
    roles: await filteredEnforcer.getRolesForUser(userId)
  };
}

// Fast enforcement with shared enforcer
app.get('/data/:id', async (req, res) => {
  const allowed = await sharedEnforcer.enforce(req.user.id, req.params.id, 'read');
  if (!allowed) return res.status(403).send('Access denied');
  res.json(await getData(req.params.id));
});

// Detailed view with filtered enforcer
app.get('/my-permissions', async (req, res) => {
  const view = await getUserPermissionView(req.user.id, req.user.orgId);
  res.json(view);
});
```

## API Reference

### newFilteredEnforcer()

Creates an enforcer with filtered policies loaded.

```typescript
async function newFilteredEnforcer(
  modelPath: string,
  adapter: Adapter,
  filter: any,
  enableLog?: boolean
): Promise<Enforcer>
```

**Parameters:**
- `modelPath`: Path to the model configuration file
- `adapter`: Adapter instance that implements `FilteredAdapter` interface
- `filter`: Filter object specifying which policies to load. Keys are policy types ('p', 'g', etc.) and values are arrays of field values to match. Empty strings act as wildcards.
- `enableLog`: (Optional) Enable Casbin logging

**Returns:** Promise that resolves to an Enforcer instance with filtered policies loaded

**Filter Format:**
The filter object matches policy fields in order. For a model with `p = sub, dom, obj, act`:
- `{ p: ['alice'] }` - Match subject='alice' (any domain, object, action)
- `{ p: ['', 'org1'] }` - Match any subject, domain='org1' (any object, action)
- `{ p: ['alice', 'org1'] }` - Match subject='alice', domain='org1' (any object, action)
- `{ p: ['alice', 'org1', 'data1'] }` - Match subject='alice', domain='org1', object='data1' (any action)

Empty strings ('') in the filter array act as wildcards, matching any value for that field.

**Example:**
```javascript
// For a model with: p = sub, dom, obj, act
const enforcer = await newFilteredEnforcer(
  'model.conf',
  adapter,
  { 
    p: ['', 'org1'],  // Load p rules where domain='org1'
    g: ['', '', 'org1']  // Load g rules where domain='org1' (for g = _, _, _)
  }
);
```

### loadFilteredPolicy()

Loads filtered policies into an existing enforcer.

```typescript
async loadFilteredPolicy(filter: any): Promise<boolean>
```

**Parameters:**
- `filter`: Filter object specifying which policies to load (same format as newFilteredEnforcer)

**Returns:** Promise that resolves to true if successful

**Example:**
```javascript
const enforcer = await newEnforcer('model.conf', adapter, true); // lazyLoad=true
await enforcer.loadFilteredPolicy({ 
  p: ['', 'org1'],  // Filter by domain field
  g: ['', '', 'org1'] 
});
```

### isFiltered()

Checks if the enforcer has filtered policies loaded.

```typescript
isFiltered(): boolean
```

**Returns:** true if policies are filtered, false otherwise

## Important Considerations

### ✅ What Works with Filtered Enforcers

1. **Enforcement checks**: `enforce()`, `enforceEx()`, `batchEnforce()`
2. **Individual policy operations** (with `autoSave` enabled):
   - `addPolicy()`, `removePolicy()`, `updatePolicy()`
   - `addRoleForUser()`, `deleteRoleForUser()`
   - All incremental policy modification APIs
3. **Policy queries**:
   - `getPolicy()`, `getFilteredPolicy()`
   - `getPermissionsForUser()`, `getRolesForUser()`
   - All query APIs (operate on loaded subset)
4. **Role operations**: All RBAC APIs work with the loaded subset

### ❌ What Doesn't Work with Filtered Enforcers

1. **`savePolicy()`**: Throws an error to prevent data loss
   - Calling `savePolicy()` on a filtered enforcer would overwrite your entire policy database with just the filtered subset
   - This is a safety feature to prevent accidental data loss

### 🔧 How Policy Modifications Work

When you modify policies on a filtered enforcer:

```javascript
const enforcer = await newFilteredEnforcer('model.conf', adapter, { p: ['org1'] });

// This works! It calls adapter.addPolicy() which is an incremental operation
await enforcer.addPolicy('alice', 'org1', 'data1', 'read');

// This also works! It calls adapter.removePolicy()
await enforcer.removePolicy('alice', 'org1', 'data1', 'read');

// This throws an error! It would call adapter.savePolicy() with incomplete data
await enforcer.savePolicy(); // Error: Cannot save a filtered policy
```

The key is that **incremental operations** (add, remove, update) work through the adapter's incremental methods, while `savePolicy()` would dump the entire in-memory policy to storage.

### 🔒 Thread Safety

- Shared enforcers: Use `SyncedEnforcer` for concurrent access
- Per-request filtered enforcers: Thread-safe by design (isolated per request)

### 💾 Database Adapter Requirements

Your database adapter must implement the `FilteredAdapter` interface:

```typescript
interface FilteredAdapter extends Adapter {
  loadFilteredPolicy(model: Model, filter: any): Promise<void>;
  isFiltered(): boolean;
}
```

Popular adapters with filtered policy support:
- [node-casbin-sequelize-adapter](https://github.com/node-casbin/sequelize-adapter)
- [node-casbin-typeorm-adapter](https://github.com/node-casbin/typeorm-adapter)
- [node-casbin-mongodb-adapter](https://github.com/node-casbin/mongodb-adapter)

Check your adapter's documentation for filter format details.

### 📊 Performance Considerations

1. **Creating enforcers is expensive**: Each `newFilteredEnforcer()` call reads from database
2. **Use caching**: Cache filtered enforcers when possible (see Pattern 3)
3. **Shared enforcer is faster**: For simple enforcement checks, use a shared enforcer
4. **Filter granularity**: Balance between memory usage and database queries

## Examples

See [examples/filtered_policy_example.js](examples/filtered_policy_example.js) for complete working examples including:

1. Per-request filtered enforcer pattern
2. Caching pattern for filtered enforcers
3. Incremental policy updates
4. Recommended usage patterns for different scenarios

## Summary

**Use Shared Enforcer when:**
- You have moderate number of policies (< 1 million)
- Policies fit in memory
- Need fast enforcement checks
- Simple deployment

**Use Filtered Enforcer when:**
- You have millions of policies across many tenants
- Need strong tenant isolation
- Want to display user-specific permission lists
- Memory is a constraint

**Best Practice:**
Use a shared enforcer for enforcement checks and create filtered enforcers only when you need tenant-specific views or lists of permissions.

For more information, see the [Casbin documentation](https://casbin.org/docs/policy-subset-loading).

// Copyright 2025 The Casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Example: Using Filtered Policies in a Web Framework
 * 
 * This example demonstrates how to use Casbin with filtered policies in a web framework
 * context where you have many users and want to create per-request enforcers.
 * 
 * Key Points:
 * 1. Create a filtered enforcer per request using loadFilteredPolicy()
 * 2. The enforcer loads only policies relevant to the current user/domain
 * 3. Policy modifications (addPolicy, removePolicy) work with autoSave enabled
 * 4. savePolicy() is blocked for filtered enforcers to prevent data loss
 */

const { newEnforcer, DefaultFilteredAdapter } = require('../lib/cjs/index');

/**
 * Example 1: Creating a per-request filtered enforcer
 */
async function perRequestFilteredEnforcer() {
  console.log('\n=== Example 1: Per-Request Filtered Enforcer ===\n');

  // Simulating a web framework middleware
  async function authMiddleware(req, res, next) {
    const userId = req.user.id;
    const domain = req.user.domain;

    // Create a new enforcer instance for this request with filtered policies
    // In production, you would use a database adapter instead of file adapter
    const adapter = new DefaultFilteredAdapter('examples/rbac_with_domains_policy.csv');
    const enforcer = await newEnforcer('examples/rbac_with_domains_model.conf', adapter, true); // lazyLoad=true

    // Load only policies for this domain
    // Note: The DefaultFilteredAdapter is for demonstration. 
    // For production, use a database adapter that implements FilteredAdapter interface
    // Filter format: fields match policy definition order after the policy type
    // For rbac_with_domains: p = sub, dom, obj, act
    // So filter.p = ['', 'domain1'] means: any sub, domain='domain1', any obj, any act
    await enforcer.loadFilteredPolicy({
      p: ['', domain],  // Filter p rules by domain (second field)
      g: ['', '', domain]  // Filter g rules by domain (third field)
    });

    // Attach enforcer to request for use in route handlers
    req.enforcer = enforcer;
    next();
  }

  // Simulated request
  const req = {
    user: { id: 'alice', domain: 'domain1' },
    enforcer: null
  };

  // Call middleware
  await authMiddleware(req, {}, () => {});

  // Now in your route handler, use the filtered enforcer
  const canRead = await req.enforcer.enforce('alice', 'domain1', 'data1', 'read');
  console.log('Alice can read data1 in domain1:', canRead);

  // The enforcer is filtered, so savePolicy() will throw an error
  try {
    await req.enforcer.savePolicy();
  } catch (err) {
    console.log('Expected error:', err.message);
  }

  // However, you can still add/remove individual policies with autoSave
  console.log('\nAdding policy with autoSave enabled (default)...');
  // This will work because it uses adapter.addPolicy() not adapter.savePolicy()
  // Note: In production with a database adapter, this would update the database
  await req.enforcer.addPolicy('alice', 'org1', 'data2', 'write');
  console.log('Policy added successfully');
}

/**
 * Example 2: Efficient caching pattern
 */
async function cachedFilteredEnforcer() {
  console.log('\n=== Example 2: Caching Pattern ===\n');

  // Create a cache for enforcer instances
  const enforcerCache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async function getEnforcerForDomain(domain) {
    const cacheKey = `domain:${domain}`;
    const cached = enforcerCache.get(cacheKey);

    // Check if cached and not expired
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached enforcer for ${domain}`);
      return cached.enforcer;
    }

    // Create new filtered enforcer
    console.log(`Creating new filtered enforcer for ${domain}`);
    const adapter = new DefaultFilteredAdapter('examples/rbac_with_domains_policy.csv');
    const enforcer = await newEnforcer('examples/rbac_with_domains_model.conf', adapter, true); // lazyLoad=true
    
    await enforcer.loadFilteredPolicy({
      p: ['', domain],  // Filter by domain field
      g: ['', '', domain]
    });

    // Cache it
    enforcerCache.set(cacheKey, {
      enforcer,
      timestamp: Date.now()
    });

    return enforcer;
  }

  // Usage
  const enforcer1 = await getEnforcerForDomain('domain1');
  const enforcer2 = await getEnforcerForDomain('domain1'); // Will use cached version

  console.log('Both enforcers are the same instance:', enforcer1 === enforcer2);
}

/**
 * Example 3: Working with filtered policies and incremental updates
 */
async function incrementalPolicyUpdates() {
  console.log('\n=== Example 3: Incremental Policy Updates ===\n');

  const adapter = new DefaultFilteredAdapter('examples/rbac_with_domains_policy.csv');
  const enforcer = await newEnforcer('examples/rbac_with_domains_model.conf', adapter, true); // lazyLoad=true
  
  // Load filtered policies for org1 (domain1)
  await enforcer.loadFilteredPolicy({
    p: ['', 'domain1'],  // Filter by domain
    g: ['', '', 'domain1']
  });

  console.log('Loaded filtered policies for domain1');
  console.log('Is filtered:', enforcer.isFiltered());

  // Check current permissions
  const policies = await enforcer.getPolicy();
  console.log('Current policies:', policies);

  // Add a new policy - this works even with filtered enforcer
  // because it uses adapter.addPolicy() which is an incremental operation
  console.log('\nAdding new policy...');
  const added = await enforcer.addPolicy('alice', 'domain1', 'data3', 'read');
  console.log('Policy added:', added);

  // Remove a policy - also works with filtered enforcer
  console.log('\nRemoving policy...');
  const removed = await enforcer.removePolicy('alice', 'domain1', 'data3', 'read');
  console.log('Policy removed:', removed);

  // Add role for user - works with filtered enforcer
  console.log('\nAdding role for user...');
  const roleAdded = await enforcer.addRoleForUser('bob', 'admin', 'domain1');
  console.log('Role added:', roleAdded);
}

/**
 * Example 4: Safe usage pattern recommendation
 */
function recommendedUsagePattern() {
  console.log('\n=== Example 4: Recommended Usage Pattern ===\n');

  console.log(`
Recommended Pattern for Web Frameworks:

1. SHARED ENFORCER (for read-only operations):
   - Create ONE enforcer instance at app startup
   - Load ALL policies with loadPolicy()
   - Share this instance across all requests
   - Use for enforcement checks: enforce(user, resource, action)
   - DO NOT modify policies through this instance

2. PER-REQUEST FILTERED ENFORCER (for user/org-specific views):
   - Create filtered enforcer per request if needed
   - Use for getting user-specific data: getPermissionsForUser()
   - Use for displaying user's permissions in UI
   - Can use incremental updates: addPolicy(), removePolicy()
   - NEVER call savePolicy() on filtered enforcers

3. ADMIN ENFORCER (for policy management):
   - Create separate enforcer instance for admin operations
   - Load ALL policies with loadPolicy()
   - Use for bulk policy updates
   - Can safely call savePolicy() after modifications
   - Notify watcher to update other instances

Example code structure:

// App initialization
const sharedEnforcer = await newEnforcer(modelPath, adapter);
await sharedEnforcer.loadPolicy();

// In request handler (for enforcement)
const canAccess = await sharedEnforcer.enforce(req.user, req.resource, req.action);

// For user-specific permission views (optional)
const filteredEnforcer = await newEnforcer(modelPath, adapter);
await filteredEnforcer.loadFilteredPolicy({ p: [req.user.org] });
const permissions = await filteredEnforcer.getPermissionsForUser(req.user.id);

// For policy modifications (admin only)
await sharedEnforcer.addPolicy(user, resource, action);
// The change is automatically saved to DB with autoSave enabled
// And other instances are notified via watcher
  `);
}

// Run examples
async function main() {
  try {
    await perRequestFilteredEnforcer();
    await cachedFilteredEnforcer();
    await incrementalPolicyUpdates();
    recommendedUsagePattern();
  } catch (err) {
    console.error('Error:', err);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  perRequestFilteredEnforcer,
  cachedFilteredEnforcer,
  incrementalPolicyUpdates,
  recommendedUsagePattern
};

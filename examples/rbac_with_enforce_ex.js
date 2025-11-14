// Copyright 2024 The Casbin Authors. All Rights Reserved.
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
 * This example demonstrates how to use enforceEx() with RBAC model.
 * enforceEx() returns both the enforcement result and the matched policy rule,
 * which is helpful for understanding which permission allowed the request.
 */

const { newEnforcer } = require('casbin');

async function main() {
  // Initialize enforcer with RBAC model
  const enforcer = await newEnforcer(
    'examples/rbac_model.conf',
    'examples/rbac_policy.csv'
  );

  console.log('=== RBAC Model with enforceEx() Demo ===\n');

  // Display the policies
  console.log('Policies (p):');
  const policies = await enforcer.getPolicy();
  policies.forEach(p => console.log(`  ${p.join(', ')}`));

  console.log('\nRole assignments (g):');
  const roles = await enforcer.getGroupingPolicy();
  roles.forEach(r => console.log(`  ${r.join(', ')}`));

  console.log('\n=== Enforcement Examples ===\n');

  // Example 1: Direct permission
  console.log('1. Direct permission check:');
  console.log('   Checking: alice, data1, read');
  let [allowed, explanation] = await enforcer.enforceEx('alice', 'data1', 'read');
  console.log(`   Result: ${allowed}`);
  console.log(`   Matched rule: [${explanation.join(', ')}]`);
  console.log('   → Alice has direct permission to read data1\n');

  // Example 2: Role-based permission (alice has role data2_admin)
  console.log('2. Role-based permission check:');
  console.log('   Checking: alice, data2, read');
  [allowed, explanation] = await enforcer.enforceEx('alice', 'data2', 'read');
  console.log(`   Result: ${allowed}`);
  console.log(`   Matched rule: [${explanation.join(', ')}]`);
  console.log('   → Alice has data2_admin role, which can read data2\n');

  // Example 3: Role-based permission (alice has role data2_admin)
  console.log('3. Role-based permission check:');
  console.log('   Checking: alice, data2, write');
  [allowed, explanation] = await enforcer.enforceEx('alice', 'data2', 'write');
  console.log(`   Result: ${allowed}`);
  console.log(`   Matched rule: [${explanation.join(', ')}]`);
  console.log('   → Alice has data2_admin role, which can write data2\n');

  // Example 4: No permission
  console.log('4. No permission check:');
  console.log('   Checking: alice, data2, delete');
  [allowed, explanation] = await enforcer.enforceEx('alice', 'data2', 'delete');
  console.log(`   Result: ${allowed}`);
  console.log(`   Matched rule: [${explanation.join(', ')}]`);
  console.log('   → Alice does not have permission to delete data2\n');

  // Example 5: Check what roles a user has
  console.log('5. Getting user roles:');
  const aliceRoles = await enforcer.getRolesForUser('alice');
  console.log(`   Alice's roles: [${aliceRoles.join(', ')}]`);

  // Example 6: Check permissions for a role
  console.log('\n6. Getting role permissions:');
  const adminPerms = await enforcer.getPermissionsForUser('data2_admin');
  console.log('   data2_admin permissions:');
  adminPerms.forEach(p => console.log(`     [${p.join(', ')}]`));

  console.log('\n=== Key Takeaways ===');
  console.log('• enforceEx() returns [boolean, string[]] - result and matched rule');
  console.log('• For RBAC, the matched rule shows which policy allowed the access');
  console.log('• If access is through a role, the rule contains the role name, not the user');
  console.log('• This is useful for debugging and audit trails');
}

main().catch(console.error);

# [5.36.0](https://github.com/casbin/node-casbin/compare/v5.35.0...v5.36.0) (2024-11-22)


### Features

* add BracketAwareCsvParser to parse CSV file better ([#494](https://github.com/casbin/node-casbin/issues/494)) ([4c73883](https://github.com/casbin/node-casbin/commit/4c738831ebbf71f8f3a6ccac8495644c09a5e5dd))

# [5.35.0](https://github.com/casbin/node-casbin/compare/v5.34.0...v5.35.0) (2024-11-20)


### Features

* update to @casbin/expression-eval 5.3.0 to fix short-circuit bug ([#495](https://github.com/casbin/node-casbin/issues/495)) ([094bef7](https://github.com/casbin/node-casbin/commit/094bef7aec70eac4c5a0e4c79dea8178f81b4626))

# [5.34.0](https://github.com/casbin/node-casbin/compare/v5.33.0...v5.34.0) (2024-11-04)


### Features

* switch dependency to our own package: @casbin/expression-eval 5.2.0 ([#489](https://github.com/casbin/node-casbin/issues/489)) ([acf39c2](https://github.com/casbin/node-casbin/commit/acf39c26e578d0125f8246aafafa75e52b17109a))

# [5.32.0](https://github.com/casbin/node-casbin/compare/v5.31.0...v5.32.0) (2024-10-20)


### Features

* use `import { Buffer } from 'buffer/'` to be compatible with Bun ([#486](https://github.com/casbin/node-casbin/issues/486)) ([738b2b6](https://github.com/casbin/node-casbin/commit/738b2b67c6369381a34a2fe01a978249205c5802))

# [5.31.0](https://github.com/casbin/node-casbin/compare/v5.30.0...v5.31.0) (2024-09-28)


### Features

* prevent duplicated sections and invalid operators in config and model ([#484](https://github.com/casbin/node-casbin/issues/484)) ([79e0f1c](https://github.com/casbin/node-casbin/commit/79e0f1c8fa551ce456b97729d52a49c762d91169))

# [5.30.0](https://github.com/casbin/node-casbin/compare/v5.29.0...v5.30.0) (2024-04-26)


### Features

* ensure eft and priority are respected in p2, r2, etc ([#475](https://github.com/casbin/node-casbin/issues/475)) ([8ef3deb](https://github.com/casbin/node-casbin/commit/8ef3debae7d8f081629b038d78e3d869c32be7f2)), closes [#474](https://github.com/casbin/node-casbin/issues/474)

# [5.29.0](https://github.com/casbin/node-casbin/compare/v5.28.0...v5.29.0) (2024-04-10)


### Features

* update CI Node.js version to 18 and 20 ([4aa74ab](https://github.com/casbin/node-casbin/commit/4aa74ab710aa300c172c71b802453dd64b3ec1a7))

# [5.28.0](https://github.com/casbin/node-casbin/compare/v5.27.1...v5.28.0) (2023-11-21)


### Features

* fix WatcherEx not triggered issue ([61c1595](https://github.com/casbin/node-casbin/commit/61c159533904f38d82eb0418a1de949666cc381a))

## [5.27.1](https://github.com/casbin/node-casbin/compare/v5.27.0...v5.27.1) (2023-09-19)


### Bug Fixes

* KeyMatch5 does not match the expected result ([#458](https://github.com/casbin/node-casbin/issues/458)) ([0df458d](https://github.com/casbin/node-casbin/commit/0df458dde1f7a061167b978e16e712d208944f39))

# [5.27.0](https://github.com/casbin/node-casbin/compare/v5.26.2...v5.27.0) (2023-08-30)


### Features

* add `enforceWithMatcher` & `enforceExWithMatcher` ([#453](https://github.com/casbin/node-casbin/issues/453)) ([a85192f](https://github.com/casbin/node-casbin/commit/a85192f382fc164107d3117b4490cf8dd072c0e5))

## [5.26.2](https://github.com/casbin/node-casbin/compare/v5.26.1...v5.26.2) (2023-07-29)


### Bug Fixes

* add escapeCsv() for CSV file saving ([17c542a](https://github.com/casbin/node-casbin/commit/17c542ad894cc19b592e3c54495fb05eff02f215))

## [5.26.1](https://github.com/casbin/node-casbin/compare/v5.26.0...v5.26.1) (2023-03-29)


### Bug Fixes

* escapeAssertion is compatible with safari ([#444](https://github.com/casbin/node-casbin/issues/444)) ([d13a3b9](https://github.com/casbin/node-casbin/commit/d13a3b9030da1603f746dd20bc93354df81b182a))

# [5.26.0](https://github.com/casbin/node-casbin/compare/v5.25.0...v5.26.0) (2023-03-26)


### Features

* Multiple sections type ([#442](https://github.com/casbin/node-casbin/issues/442)) ([48b0d8f](https://github.com/casbin/node-casbin/commit/48b0d8fbbf302f61aed20bb6d0f2354354df9941))

# [5.25.0](https://github.com/casbin/node-casbin/compare/v5.24.4...v5.25.0) (2023-03-20)


### Features

* replace picomatch with minimatch ([#440](https://github.com/casbin/node-casbin/issues/440)) ([4e977b3](https://github.com/casbin/node-casbin/commit/4e977b33fdece9b8934693d05a1da9a7f10cfa05))

## [5.24.4](https://github.com/casbin/node-casbin/compare/v5.24.3...v5.24.4) (2023-03-12)


### Bug Fixes

* **./src/util/util.ts:** fixed unwanted replacement of .r in evals according to issue [#438](https://github.com/casbin/node-casbin/issues/438) ([#439](https://github.com/casbin/node-casbin/issues/439)) ([39878be](https://github.com/casbin/node-casbin/commit/39878be7e22ff9f18c0898c5828328bc1cc95aba))

## [5.24.3](https://github.com/casbin/node-casbin/compare/v5.24.2...v5.24.3) (2023-02-27)


### Bug Fixes

* built-in buffer and upgrade csv-parse ([#436](https://github.com/casbin/node-casbin/issues/436)) ([0f40bee](https://github.com/casbin/node-casbin/commit/0f40beed52d5cae9e47ce2da9ebfcab5c52a4038))

## [5.24.2](https://github.com/casbin/node-casbin/compare/v5.24.1...v5.24.2) (2023-02-24)


### Bug Fixes

* using import() to load the fs ([#435](https://github.com/casbin/node-casbin/issues/435)) ([e90a8bf](https://github.com/casbin/node-casbin/commit/e90a8bf064963dd448cfa67da5af0f9aad957999))

## [5.24.1](https://github.com/casbin/node-casbin/compare/v5.24.0...v5.24.1) (2023-02-17)


### Bug Fixes

* remove lodash usage and types ([#432](https://github.com/casbin/node-casbin/issues/432)) ([9c227d5](https://github.com/casbin/node-casbin/commit/9c227d51ef3feb6f6a3d30705d2784921d85dece))

# [5.24.0](https://github.com/casbin/node-casbin/compare/v5.23.2...v5.24.0) (2023-02-17)


### Features

* add built-in FileSystem ([#430](https://github.com/casbin/node-casbin/issues/430)) ([999c34c](https://github.com/casbin/node-casbin/commit/999c34c620c7b8d608c7405550737bc0dfa974f5))

## [5.23.2](https://github.com/casbin/node-casbin/compare/v5.23.1...v5.23.2) (2023-02-04)


### Bug Fixes

* fix typo in subject_priority_policy.csv ([#425](https://github.com/casbin/node-casbin/issues/425)) ([ada2543](https://github.com/casbin/node-casbin/commit/ada25436fe7baa37959e1d4f67a644e833e88656))

## [5.23.1](https://github.com/casbin/node-casbin/compare/v5.23.0...v5.23.1) (2023-02-02)


### Bug Fixes

* avoid the impact of line breaks CRLF in frontend.test.ts ([#420](https://github.com/casbin/node-casbin/issues/420)) ([7c32e23](https://github.com/casbin/node-casbin/commit/7c32e237a0881d74d8792e4ea7695999960e2e21))

# [5.23.0](https://github.com/casbin/node-casbin/compare/v5.22.0...v5.23.0) (2023-02-01)


### Features

* support `updateGroupingPolicy()`, `updateNamedGroupingPolicy()`, `getImplicitResourcesForUser()` ([#419](https://github.com/casbin/node-casbin/issues/419)) ([46c0f3a](https://github.com/casbin/node-casbin/commit/46c0f3ad09c4e8cf673d9d9b9b8fcf00251caaaf))

# [5.22.0](https://github.com/casbin/node-casbin/compare/v5.21.0...v5.22.0) (2023-01-31)


### Features

* support subjectPriority ([#417](https://github.com/casbin/node-casbin/issues/417)) ([e83d505](https://github.com/casbin/node-casbin/commit/e83d5058872e65be7dc9b374ca8c6640a1f2ca9d))

# [5.21.0](https://github.com/casbin/node-casbin/compare/v5.20.4...v5.21.0) (2023-01-21)


### Features

* support setNamedRoleManager() ([#416](https://github.com/casbin/node-casbin/issues/416)) ([869e8f9](https://github.com/casbin/node-casbin/commit/869e8f989b899073e071fa90777584f12cde0856))

## [5.20.4](https://github.com/casbin/node-casbin/compare/v5.20.3...v5.20.4) (2023-01-20)


### Bug Fixes

* add groupPolicy for GetPermissionForUser in frontend.ts ([#415](https://github.com/casbin/node-casbin/issues/415)) ([5d1a679](https://github.com/casbin/node-casbin/commit/5d1a6795f94af487218f10dce85fe191fb0dea37))

## [5.20.3](https://github.com/casbin/node-casbin/compare/v5.20.2...v5.20.3) (2023-01-10)


### Bug Fixes

* Multiline Separator Handling ([#411](https://github.com/casbin/node-casbin/issues/411)) ([ab3467a](https://github.com/casbin/node-casbin/commit/ab3467a40004d48d323ebc79078077c8e1593514))

## [5.20.2](https://github.com/casbin/node-casbin/compare/v5.20.1...v5.20.2) (2023-01-08)


### Bug Fixes

* Upgraded CI Nodejs version to v14.16.18. ([#410](https://github.com/casbin/node-casbin/issues/410)) ([9aadcd7](https://github.com/casbin/node-casbin/commit/9aadcd796cc474e8417b7ce78ecebb7096010a77))

## [5.20.1](https://github.com/casbin/node-casbin/compare/v5.20.0...v5.20.1) (2022-12-31)


### Bug Fixes

* delete unused files in examples ([#407](https://github.com/casbin/node-casbin/issues/407)) ([323a750](https://github.com/casbin/node-casbin/commit/323a7500e9860e5530b858d09344d92d3a15706a))

# [5.20.0](https://github.com/casbin/node-casbin/compare/v5.19.3...v5.20.0) (2022-12-29)


### Features

* **defaultrolemanager.ts:** add hierarchical domain support for rbac ([#380](https://github.com/casbin/node-casbin/issues/380)) ([da980af](https://github.com/casbin/node-casbin/commit/da980afd80303d37a5c3e073250ed64c217c3225)), closes [#377](https://github.com/casbin/node-casbin/issues/377)

## [5.19.3](https://github.com/casbin/node-casbin/compare/v5.19.2...v5.19.3) (2022-12-02)


### Bug Fixes

* update express-eval dependency to v5 ([#400](https://github.com/casbin/node-casbin/issues/400)) ([02a9496](https://github.com/casbin/node-casbin/commit/02a94967aa182fbc588e4ca7da70c7b55e5e8407))

## [5.19.2](https://github.com/casbin/node-casbin/compare/v5.19.1...v5.19.2) (2022-11-12)


### Bug Fixes

* Revert "fix: escape assertion bug ([#394](https://github.com/casbin/node-casbin/issues/394))" ([#398](https://github.com/casbin/node-casbin/issues/398)) ([6127584](https://github.com/casbin/node-casbin/commit/61275848007386550dc211e3ed0b13388e654a29))

## [5.19.1](https://github.com/casbin/node-casbin/compare/v5.19.0...v5.19.1) (2022-10-04)


### Bug Fixes

* escape assertion bug ([#394](https://github.com/casbin/node-casbin/issues/394)) ([5a339d8](https://github.com/casbin/node-casbin/commit/5a339d858a9cfb7d8899355cbd179ec962b43cfa))

# [5.19.0](https://github.com/casbin/node-casbin/compare/v5.18.0...v5.19.0) (2022-09-24)


### Features

* add `fieldIndexMap` ([#391](https://github.com/casbin/node-casbin/issues/391)) ([8f6e2c3](https://github.com/casbin/node-casbin/commit/8f6e2c39a19725e467aafda8b7fa948e3e471ce8))

# [5.18.0](https://github.com/casbin/node-casbin/compare/v5.17.0...v5.18.0) (2022-09-14)


### Features

* add management api for watcherEx callbacks ([#384](https://github.com/casbin/node-casbin/issues/384)) ([591233f](https://github.com/casbin/node-casbin/commit/591233f4b80dec422a7dc299c605f7a0e22dba9f))

# [5.17.0](https://github.com/casbin/node-casbin/compare/v5.16.0...v5.17.0) (2022-08-18)


### Features

* add WatcherEx ([#381](https://github.com/casbin/node-casbin/issues/381)) ([10d7086](https://github.com/casbin/node-casbin/commit/10d7086c810ff18d9a3c792a3ec1173744bceeef))

# [5.16.0](https://github.com/casbin/node-casbin/compare/v5.15.2...v5.16.0) (2022-08-11)


### Features

* add support for g() in SyncedEnforcer ([#378](https://github.com/casbin/node-casbin/issues/378)) ([a74067a](https://github.com/casbin/node-casbin/commit/a74067a66aec755e89bd32964e9da4252c117881))

## [5.15.2](https://github.com/casbin/node-casbin/compare/v5.15.1...v5.15.2) (2022-06-22)


### Bug Fixes

* enable esModuleInterop support ([#366](https://github.com/casbin/node-casbin/issues/366)) ([20db339](https://github.com/casbin/node-casbin/commit/20db3390ef70656b8e06a6738d4c377b4dbe5017))

## [5.15.1](https://github.com/casbin/node-casbin/compare/v5.15.0...v5.15.1) (2022-04-27)


### Bug Fixes

* EnforceEx return allow reason ([#363](https://github.com/casbin/node-casbin/issues/363)) ([6353283](https://github.com/casbin/node-casbin/commit/635328328caf200093e89443d32e9f2fa736509a))

# [5.15.0](https://github.com/casbin/node-casbin/compare/v5.14.0...v5.15.0) (2022-04-15)


### Features

* [#357](https://github.com/casbin/node-casbin/issues/357) Support keyMatch5 ([#359](https://github.com/casbin/node-casbin/issues/359)) ([e6a6d8a](https://github.com/casbin/node-casbin/commit/e6a6d8ab253af70bb46ef7c27c6ebf48c55d76c8))

# [5.14.0](https://github.com/casbin/node-casbin/compare/v5.13.2...v5.14.0) (2022-03-18)


### Features

* **rbac:** add `getUsersForRoleInDomain` & `getRolesForUserInDomain` ([#351](https://github.com/casbin/node-casbin/issues/351)) ([4896ca2](https://github.com/casbin/node-casbin/commit/4896ca260c2f35672b9b520969898155ec616f0b)), closes [#304](https://github.com/casbin/node-casbin/issues/304)

## [5.13.2](https://github.com/casbin/node-casbin/compare/v5.13.1...v5.13.2) (2022-03-02)


### Bug Fixes

* *matcher result should be boolean or number* for KeyGet2 ([#347](https://github.com/casbin/node-casbin/issues/347)) ([0257078](https://github.com/casbin/node-casbin/commit/0257078e1302f5ef081ec143afe5c470f4f862e9))

## [5.13.1](https://github.com/casbin/node-casbin/compare/v5.13.0...v5.13.1) (2022-02-22)


### Bug Fixes

* 'eval' not detected ([86e2add](https://github.com/casbin/node-casbin/commit/86e2add7c5aaa7901d21c1c4b9cb8e6d0b8bef75))
* created two regex expressions ([de5f2f4](https://github.com/casbin/node-casbin/commit/de5f2f4f27f40941b125bf068b8f90e44ba69fb1))

# [5.13.0](https://github.com/casbin/node-casbin/compare/v5.12.0...v5.13.0) (2022-01-25)


### Features

* getImplicitUsersForRole ([#341](https://github.com/casbin/node-casbin/issues/341)) ([ebfaede](https://github.com/casbin/node-casbin/commit/ebfaede003cf0a4eef8a16f815f06518e74974fb))

# [5.12.0](https://github.com/casbin/node-casbin/compare/v5.11.5...v5.12.0) (2022-01-16)


### Features

* **batchenforce:** added batchEnforce ([#338](https://github.com/casbin/node-casbin/issues/338)) ([56e55bd](https://github.com/casbin/node-casbin/commit/56e55bd58b0f5be4a45e753f5ad58b01a27ef8b2)), closes [#321](https://github.com/casbin/node-casbin/issues/321)

## [5.11.5](https://github.com/casbin/node-casbin/compare/v5.11.4...v5.11.5) (2021-08-18)


### Bug Fixes

* fix error overloading for role manager ([#319](https://github.com/casbin/node-casbin/issues/319)) ([e69450b](https://github.com/casbin/node-casbin/commit/e69450b53a06be4abda9b1669d578ef1e27dc19d))

## [5.11.4](https://github.com/casbin/node-casbin/compare/v5.11.3...v5.11.4) (2021-08-17)


### Bug Fixes

* **replaceeval:** add third param to replaceEval and only replace eval() w/ matching ruleName ([#316](https://github.com/casbin/node-casbin/issues/316)) ([bd4f5bf](https://github.com/casbin/node-casbin/commit/bd4f5bfb726c56b323d1417dc415deca21d2c170)), closes [#315](https://github.com/casbin/node-casbin/issues/315) [#315](https://github.com/casbin/node-casbin/issues/315)

## [5.11.3](https://github.com/casbin/node-casbin/compare/v5.11.2...v5.11.3) (2021-08-13)


### Bug Fixes

* add support for legacy array definition method ([#313](https://github.com/casbin/node-casbin/issues/313)) ([635eece](https://github.com/casbin/node-casbin/commit/635eece1bead0bb365b9ea50f325860d1df3abc6))

## [5.11.2](https://github.com/casbin/node-casbin/compare/v5.11.1...v5.11.2) (2021-08-13)


### Bug Fixes

* add full supoort for `in` operator ([#310](https://github.com/casbin/node-casbin/issues/310)) ([446f8c7](https://github.com/casbin/node-casbin/commit/446f8c700ab13cea5413d311da33e80dd6165f0e))

## [5.11.1](https://github.com/casbin/node-casbin/compare/v5.11.0...v5.11.1) (2021-07-29)


### Bug Fixes

* fix `in` opertor ([17f3588](https://github.com/casbin/node-casbin/commit/17f35881522d1ad454de1a70ee1b12db7735788a))

# [5.11.0](https://github.com/casbin/node-casbin/compare/v5.10.0...v5.11.0) (2021-07-23)


### Features

* add keyGet and keyGet2 ([#302](https://github.com/casbin/node-casbin/issues/302)) ([36e83cf](https://github.com/casbin/node-casbin/commit/36e83cf6fef78d954062ae61d26a74842e6367d2))

# [5.10.0](https://github.com/casbin/node-casbin/compare/v5.9.0...v5.10.0) (2021-07-19)


### Features

* use new license format ([284d2a4](https://github.com/casbin/node-casbin/commit/284d2a48cd67db8c197de24a99029858dbbe2da8))

# [5.9.0](https://github.com/casbin/node-casbin/compare/v5.8.0...v5.9.0) (2021-06-18)


### Features

* Add lazyload option at enforcer init method ([#289](https://github.com/casbin/node-casbin/issues/289)) ([e858dcb](https://github.com/casbin/node-casbin/commit/e858dcbab2351de038e2c5385bbfd20b7aa255ad))

# [5.8.0](https://github.com/casbin/node-casbin/compare/v5.7.2...v5.8.0) (2021-06-14)


### Features

* add support for `in` operator ([a44c6a9](https://github.com/casbin/node-casbin/commit/a44c6a99ed36634a67e7888472e8f6d324b257f4))

## [5.7.2](https://github.com/casbin/node-casbin/compare/v5.7.1...v5.7.2) (2021-06-12)


### Bug Fixes

* Support for loadIncrementalFilteredPolicy ([72c2001](https://github.com/casbin/node-casbin/commit/72c2001ab064d190bfa5bcd305829d083eca52f7))

## [5.7.1](https://github.com/casbin/node-casbin/compare/v5.7.0...v5.7.1) (2021-05-19)


### Bug Fixes

* `getImplicitPermissionsForUser` works with rmMap ([#272](https://github.com/casbin/node-casbin/issues/272)) ([0d59239](https://github.com/casbin/node-casbin/commit/0d5923998fa71648c8f77a23f67ffffac2a09343))

# [5.7.0](https://github.com/casbin/node-casbin/compare/v5.6.3...v5.7.0) (2021-05-14)


### Features

* add enforceEx() ([#271](https://github.com/casbin/node-casbin/issues/271)) ([762efd9](https://github.com/casbin/node-casbin/commit/762efd9d9766fbc8e95f9d5160413ed2a8c6ce88))

## [5.6.3](https://github.com/casbin/node-casbin/compare/v5.6.2...v5.6.3) (2021-05-07)


### Bug Fixes

* fix buildRoleLinks to isolate groups ([0fb6ae7](https://github.com/casbin/node-casbin/commit/0fb6ae798ef692aaef890472421f980b58a4dfec))

## [5.6.2](https://github.com/casbin/node-casbin/compare/v5.6.1...v5.6.2) (2021-05-02)


### Bug Fixes

* transfer from micromatch to picomatch ([#264](https://github.com/casbin/node-casbin/issues/264)) ([6be1b06](https://github.com/casbin/node-casbin/commit/6be1b06f2225bc906b2a0e215ff8635c6dd3422f))

## [5.6.1](https://github.com/casbin/node-casbin/compare/v5.6.0...v5.6.1) (2021-04-05)


### Bug Fixes

* fix CasbinJsGetPermissionForUser() ([#251](https://github.com/casbin/node-casbin/issues/251)) ([98c11f1](https://github.com/casbin/node-casbin/commit/98c11f1451e71b0b002b140387f2a38bb9957c38))

# [5.6.0](https://github.com/casbin/node-casbin/compare/v5.5.0...v5.6.0) (2021-03-23)


### Features

* add priority_policy_explicit support ([#250](https://github.com/casbin/node-casbin/issues/250)) ([763c18e](https://github.com/casbin/node-casbin/commit/763c18e7f3cfa068e7b61fdd7491dd0365b86dca))

# [5.5.0](https://github.com/casbin/node-casbin/compare/v5.4.2...v5.5.0) (2021-03-19)


### Bug Fixes

* add missing await ([523ce85](https://github.com/casbin/node-casbin/commit/523ce8508ce45d7e79673bb0b498ed017772815d))
* fix errror type ([dc9e5b5](https://github.com/casbin/node-casbin/commit/dc9e5b5db766d64918a7670f6b3b72f70e84ca28))
* remove unused import ([2f8801c](https://github.com/casbin/node-casbin/commit/2f8801c47e716f69c36b49a73a45c67d9c751b92))


### Features

* add initRmMap ([87f8011](https://github.com/casbin/node-casbin/commit/87f801109e9cf4b0b423e3b76e1a8b9987b1b600))
* add named addMatchingFunc ([65d3a26](https://github.com/casbin/node-casbin/commit/65d3a2655c638085938de9df4efa5a7d16bfa788))
* add sync mode ([70e4e12](https://github.com/casbin/node-casbin/commit/70e4e12610dc42b6f25f8df268611ee1a0cbc7bd))
* add unittest ([3cd5b73](https://github.com/casbin/node-casbin/commit/3cd5b7307b54342849029c957ceec81fc84f0fdd))

## [5.4.2](https://github.com/casbin/node-casbin/compare/v5.4.1...v5.4.2) (2021-03-04)


### Bug Fixes

* improve load policy line ([9f12511](https://github.com/casbin/node-casbin/commit/9f12511e5fbfb16646b38ad30e345beee5179c9d))

## [5.4.1](https://github.com/casbin/node-casbin/compare/v5.4.0...v5.4.1) (2021-02-19)


### Bug Fixes

* fix unexpected parser action ([3074fa9](https://github.com/casbin/node-casbin/commit/3074fa9050ca073eb4c0f4197c63f13e9e7f9ebf))

# [5.4.0](https://github.com/casbin/node-casbin/compare/v5.3.1...v5.4.0) (2021-02-06)


### Features

* add updatePolicy() ([#234](https://github.com/casbin/node-casbin/issues/234)) ([a3218f1](https://github.com/casbin/node-casbin/commit/a3218f1a5d134838c0fb90c8ad1c8751e26c6332)), closes [#235](https://github.com/casbin/node-casbin/issues/235)

## [5.3.1](https://github.com/casbin/node-casbin/compare/v5.3.0...v5.3.1) (2021-01-29)


### Bug Fixes

* downgrade expression-eval back to v2.0.0 to avoid semantic-release failure, revert: https://github.com/casbin/node-casbin/pull/222 ([8c0b1fd](https://github.com/casbin/node-casbin/commit/8c0b1fd6b59c39350e90c768c54577396f89fefe))

# [5.3.0](https://github.com/casbin/node-casbin/compare/v5.2.2...v5.3.0) (2021-01-28)


### Bug Fixes

* downgrade target from ESNext to ES2017 for building esm ([7dfcf93](https://github.com/casbin/node-casbin/commit/7dfcf93a2eb7a9c9116f55341537a4c81840e3d4))
* update expression-eval ([95de296](https://github.com/casbin/node-casbin/commit/95de29650251af781d8638011dcc5cabeef2784c))


### Features

* enforceSync ([ff41f0a](https://github.com/casbin/node-casbin/commit/ff41f0a7c6eebbfafe985a929eba9e70f2c4b162))

## [5.2.3](https://github.com/casbin/node-casbin/compare/v5.2.2...v5.2.3) (2021-01-08)


### Bug Fixes

* downgrade target from ESNext to ES2017 for building esm ([7dfcf93](https://github.com/casbin/node-casbin/commit/7dfcf93a2eb7a9c9116f55341537a4c81840e3d4))
* update expression-eval ([95de296](https://github.com/casbin/node-casbin/commit/95de29650251af781d8638011dcc5cabeef2784c))

## [5.2.3](https://github.com/casbin/node-casbin/compare/v5.2.2...v5.2.3) (2021-01-08)


### Bug Fixes

* downgrade target from ESNext to ES2017 for building esm ([7dfcf93](https://github.com/casbin/node-casbin/commit/7dfcf93a2eb7a9c9116f55341537a4c81840e3d4))

## [5.2.3](https://github.com/casbin/node-casbin/compare/v5.2.2...v5.2.3) (2020-12-19)


### Bug Fixes

* downgrade target from ESNext to ES2017 for building esm ([7dfcf93](https://github.com/casbin/node-casbin/commit/7dfcf93a2eb7a9c9116f55341537a4c81840e3d4))

## [5.2.2](https://github.com/casbin/node-casbin/compare/v5.2.1...v5.2.2) (2020-11-29)


### Bug Fixes

* **builtinoperators:** fix function keyMatch3 ([1245aa0](https://github.com/casbin/node-casbin/commit/1245aa072b47135b49cb70abeed0796908a8feb7)), closes [#214](https://github.com/casbin/node-casbin/issues/214)

## [5.2.1](https://github.com/casbin/node-casbin/compare/v5.2.0...v5.2.1) (2020-11-15)


### Bug Fixes

* **rbac:** fix defaultRoleManager hasRole method ([#211](https://github.com/casbin/node-casbin/issues/211)) ([4f3ba65](https://github.com/casbin/node-casbin/commit/4f3ba65429f91250485b8a0b070f16cb750955cd))

# [5.2.0](https://github.com/casbin/node-casbin/compare/v5.1.6...v5.2.0) (2020-10-26)


### Features

* changing TypeScript target from ES6 to ES2017 ([6f4f50f](https://github.com/casbin/node-casbin/commit/6f4f50f205dfb7187e34a0439f2b4f0bf6ed5a47))

## [5.1.6](https://github.com/casbin/node-casbin/compare/v5.1.5...v5.1.6) (2020-10-07)


### Bug Fixes

* support pattern function in 3rd args of g ([#199](https://github.com/casbin/node-casbin/issues/199)) ([27005f8](https://github.com/casbin/node-casbin/commit/27005f85829f11193cb4ecfd14be5ed6e64ad63c))

## [5.1.5](https://github.com/casbin/node-casbin/compare/v5.1.4...v5.1.5) (2020-09-14)


### Bug Fixes

* ignore print model ([f426131](https://github.com/casbin/node-casbin/commit/f426131e752143251db6c11a7352d91d959cb503))

## [5.1.4](https://github.com/casbin/node-casbin/compare/v5.1.3...v5.1.4) (2020-09-10)


### Bug Fixes

* add cache to generateGFunction ([e90bed2](https://github.com/casbin/node-casbin/commit/e90bed24f6e6e3cd5b33a433c4fe7a27e494cabe))

## [5.1.3](https://github.com/casbin/node-casbin/compare/v5.1.2...v5.1.3) (2020-08-30)


### Bug Fixes

* update casbinJsGetPermissionForUser for v0.1.0 Casbin.js ([#186](https://github.com/casbin/node-casbin/issues/186)) ([6c277e8](https://github.com/casbin/node-casbin/commit/6c277e8858cf07d9a098817b72710a30c4117fa9))

## [5.1.2](https://github.com/casbin/node-casbin/compare/v5.1.1...v5.1.2) (2020-08-12)


### Bug Fixes

* add checks fieldValues to remove filtered policy ([6e144fb](https://github.com/casbin/node-casbin/commit/6e144fb9a895332245006ef3a28c47d022654895))

## [5.1.1](https://github.com/casbin/node-casbin/compare/v5.1.0...v5.1.1) (2020-08-12)


### Bug Fixes

* add check if the adapter implements BatchAdapter ([a415838](https://github.com/casbin/node-casbin/commit/a415838a514706af8a9399c899959bdb069619d4))

# [5.1.0](https://github.com/casbin/node-casbin/compare/v5.0.7...v5.1.0) (2020-08-11)


### Features

* add casbinJsGetPermissionForUser ([30ae126](https://github.com/casbin/node-casbin/commit/30ae126b962df6fc580ce943f20e8bf0ce5349c3))

## [5.0.6](https://github.com/casbin/node-casbin/compare/v5.0.5...v5.0.6) (2020-07-16)


### Bug Fixes

* add casbin-cpp to supported languages. ([b856734](https://github.com/casbin/node-casbin/commit/b85673432f8a150490fd5134797508ccd368b81f))

## [5.0.5](https://github.com/casbin/node-casbin/compare/v5.0.4...v5.0.5) (2020-07-08)


### Bug Fixes

* improve tokens separator ([687e96f](https://github.com/casbin/node-casbin/commit/687e96f1495de12bc7acd37bf56af57af490b0b6))

## [5.0.4](https://github.com/casbin/node-casbin/compare/v5.0.3...v5.0.4) (2020-06-08)

### Bug Fixes

- remove lodash ([293a852](https://github.com/casbin/node-casbin/commit/293a852803d5e83562a36bc35cdf48def0f0088b))

## [5.0.3](https://github.com/casbin/node-casbin/compare/v5.0.2...v5.0.3) (2020-05-27)

### Bug Fixes

- check adapter type ([a74314d](https://github.com/casbin/node-casbin/commit/a74314d6c4e1e1c8731128e6bfe9e2de1b3f45ce))

## [5.0.2](https://github.com/casbin/node-casbin/compare/v5.0.1...v5.0.2) (2020-05-25)

### Bug Fixes

- Add imports and batchFileAdapter implementation. ([3804c3d](https://github.com/casbin/node-casbin/commit/3804c3d76802614104016a011c07c11c54a94632))
- Add tests for batch operations. ([e6ad7af](https://github.com/casbin/node-casbin/commit/e6ad7af69344a5bd95b6490f162dba83d10c98fb))
- Merge conflicts. ([7179b17](https://github.com/casbin/node-casbin/commit/7179b17f7733f72fdd1d13ca6a7818415deb6d9c))

## [5.0.1](https://github.com/casbin/node-casbin/compare/v5.0.0...v5.0.1) (2020-05-22)

### Bug Fixes

- support comments after expression ([c97cb26](https://github.com/casbin/node-casbin/commit/c97cb26441d79316960a0464e8d56918859d969c))

# [5.0.0](https://github.com/casbin/node-casbin/compare/v4.7.2...v5.0.0) (2020-05-18)

### Features

- add BuildIncrementalRoleLinks ([b565005](https://github.com/casbin/node-casbin/commit/b5650055a6e8c47da49dc3b7eb8646bb5bda90d9))
- improve effector for improve performance ([57de7b2](https://github.com/casbin/node-casbin/commit/57de7b2f1d21ceebb7097552c86721d94cac2275))

### BREAKING CHANGES

- **model** addPolicies, removePolicies and removeFilteredPolicy returns [boolean, string[][]]
- - provides a new interface for Effector

## [4.7.2](https://github.com/casbin/node-casbin/compare/v4.7.1...v4.7.2) (2020-05-09)

### Bug Fixes

- stackoverflow in getImplicitRolesForUser ([d0fc49f](https://github.com/casbin/node-casbin/commit/d0fc49fb12c7cbb9f985d444c1ed7613ded0121b))

## [4.7.1](https://github.com/casbin/node-casbin/compare/v4.7.0...v4.7.1) (2020-05-08)

### Bug Fixes

- Add examples. ([5cf950a](https://github.com/casbin/node-casbin/commit/5cf950ad25eecfad59281d5ba9d6ddae5cde199e))
- Added ABAC policy logic to the private enforcer. ([c6fc487](https://github.com/casbin/node-casbin/commit/c6fc48750313b400fb98e12802b3422bfc1921bf))
- Added util functions and util tests. ([72918bc](https://github.com/casbin/node-casbin/commit/72918bc677e898251dd4375516c31254e79eb6b8))
- compatible types ([58242a5](https://github.com/casbin/node-casbin/commit/58242a56f9f72b1a06e4901867f502b73674d640))
- tests. ([4da5291](https://github.com/casbin/node-casbin/commit/4da52916d27f262a4813d2b4ff78461312b67c22))

# [4.7.0](https://github.com/casbin/node-casbin/compare/v4.6.0...v4.7.0) (2020-05-03)

### Features

- add getImplicitUsersForPermission ([ad9df14](https://github.com/casbin/node-casbin/commit/ad9df1417cbdb7e0d9065c78e86181d193778adf))

# [4.6.0](https://github.com/casbin/node-casbin/compare/v4.5.0...v4.6.0) (2020-05-02)

# [4.5.0](https://github.com/casbin/node-casbin/compare/v4.4.0...v4.5.0) (2020-04-30)

### Features

- avoid miss initialize() ([1394e8d](https://github.com/casbin/node-casbin/commit/1394e8ddfdc4cc9d8859ae034a8f36fb9e3b54e7))

# [4.4.0](https://github.com/casbin/node-casbin/compare/v4.3.1...v4.4.0) (2020-04-25)

### Features

- add addMatchingFunc to DefaultRoleManager ([cc04e65](https://github.com/casbin/node-casbin/commit/cc04e659a1c3b78bb12dcccbb2149bfd9d96c97c))

## [4.3.1](https://github.com/casbin/node-casbin/compare/v4.3.0...v4.3.1) (2020-04-21)

### Bug Fixes

- improve update into adapter before model ([0e9ccc6](https://github.com/casbin/node-casbin/commit/0e9ccc6b2e4387b9130df8af4fa0e23f7e73958b))

# [4.3.0](https://github.com/casbin/node-casbin/compare/v4.2.1...v4.3.0) (2020-04-20)

### Features

- controls whether to automatically notify Watcher ([2ce07c2](https://github.com/casbin/node-casbin/commit/2ce07c29cd49c6da304063e8075923b739fc5145))

## [4.2.1](https://github.com/casbin/node-casbin/compare/v4.2.0...v4.2.1) (2020-04-05)

### Bug Fixes

- remove use spread operator with await in array ([6e4f876](https://github.com/casbin/node-casbin/commit/6e4f87676301470a178ccd10efd28f6758cc738e))

# [4.2.0](https://github.com/casbin/node-casbin/compare/v4.1.1...v4.2.0) (2020-04-05)

### Features

- add glob pattern to built-in function ([8415fc2](https://github.com/casbin/node-casbin/commit/8415fc2648796d033c85771e27219bd32541982e))

## [4.1.1](https://github.com/casbin/node-casbin/compare/v4.1.0...v4.1.1) (2020-02-20)

### Bug Fixes

- **enforcer.ts:** fix deleteUser and improve deleteRole description ([1e6af16](https://github.com/casbin/node-casbin/commit/1e6af16e939543a56dbf9cb5d39924263186fc9a)), closes [#118](https://github.com/casbin/node-casbin/issues/118)

# [4.1.0](https://github.com/casbin/node-casbin/compare/v4.0.0...v4.1.0) (2020-02-13)

### Features

- synchronized enforcer ([ecec514](https://github.com/casbin/node-casbin/commit/ecec514a582f1bfad94214b61ee06fc1cab3fc36))

# [4.0.0](https://github.com/casbin/node-casbin/compare/v3.1.0...v4.0.0) (2020-02-11)

### improvement

- convert all management_api to async function ([e9f4d38](https://github.com/casbin/node-casbin/commit/e9f4d38e153b10ffbd4fa09355ec72eb3dae47cd))

### BREAKING CHANGES

- see #

# [3.1.0](https://github.com/casbin/node-casbin/compare/v3.0.9...v3.1.0) (2020-01-22)

### Features

- implementation cachedEnforcer ([0ace1a6](https://github.com/casbin/node-casbin/commit/0ace1a66a36d5fe3ada37bfaaa938b84fc001c58))

## [3.0.9](https://github.com/casbin/node-casbin/compare/v3.0.8...v3.0.9) (2020-01-14)

### Bug Fixes

- getImplicitPermissionsForUser missing domain parameter ([584624c](https://github.com/casbin/node-casbin/commit/584624c99eabca68fc790d66fc4737511d92b074))

## [3.0.8](https://github.com/casbin/node-casbin/compare/v3.0.7...v3.0.8) (2019-12-12)

## [3.0.7](https://github.com/casbin/node-casbin/compare/v3.0.6...v3.0.7) (2019-11-18)

## [3.0.6](https://github.com/casbin/node-casbin/compare/v3.0.5...v3.0.6) (2019-11-07)

## [3.0.5](https://github.com/casbin/node-casbin/compare/v3.0.4...v3.0.5) (2019-10-29)

## [3.0.3](https://github.com/casbin/node-casbin/compare/v3.0.2...v3.0.3) (2019-07-06)

## [3.0.2](https://github.com/casbin/node-casbin/compare/v3.0.1...v3.0.2) (2019-07-06)

## [3.0.1](https://github.com/casbin/node-casbin/compare/v3.0.0...v3.0.1) (2019-06-14)

# [3.0.0](https://github.com/casbin/node-casbin/compare/v3.0.0-beta.1...v3.0.0) (2019-06-05)

# [3.0.0-beta.1](https://github.com/casbin/node-casbin/compare/v2.0.3...v3.0.0-beta.1) (2019-04-29)

## [2.0.3](https://github.com/casbin/node-casbin/compare/v2.0.1...v2.0.3) (2019-04-22)

## [2.0.1](https://github.com/casbin/node-casbin/compare/v2.0.0...v2.0.1) (2019-02-08)

# [2.0.0](https://github.com/casbin/node-casbin/compare/v1.1.9...v2.0.0) (2019-01-05)

## [1.1.9](https://github.com/casbin/node-casbin/compare/v1.1.8...v1.1.9) (2018-12-20)

## [1.1.8](https://github.com/casbin/node-casbin/compare/v1.1.7...v1.1.8) (2018-12-18)

## [1.1.7](https://github.com/casbin/node-casbin/compare/v1.1.6...v1.1.7) (2018-12-14)

## [1.1.6](https://github.com/casbin/node-casbin/compare/v1.1.5...v1.1.6) (2018-12-07)

## [1.1.5](https://github.com/casbin/node-casbin/compare/v1.1.4...v1.1.5) (2018-11-02)

## [1.1.4](https://github.com/casbin/node-casbin/compare/v1.1.2...v1.1.4) (2018-11-01)

## [1.1.2](https://github.com/casbin/node-casbin/compare/v1.1.1...v1.1.2) (2018-08-27)

## [1.1.1](https://github.com/casbin/node-casbin/compare/v1.1.0...v1.1.1) (2018-08-20)

# [1.1.0](https://github.com/casbin/node-casbin/compare/v1.0.9...v1.1.0) (2018-08-17)

## [1.0.5](https://github.com/casbin/node-casbin/compare/v1.0.0...v1.0.5) (2018-08-09)

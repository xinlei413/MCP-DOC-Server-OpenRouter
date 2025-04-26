# [1.10.0](https://github.com/arabold/docs-mcp-server/compare/v1.9.0...v1.10.0) (2025-04-21)


### Bug Fixes

* **ci:** set PLAYWRIGHT_LAUNCH_ARGS for tests ([55ea901](https://github.com/arabold/docs-mcp-server/commit/55ea90165fc5552e6a3a63f0ab6a7666532bbe89))
* correct Playwright dependencies in Dockerfile ([6f19fc0](https://github.com/arabold/docs-mcp-server/commit/6f19fc0da4820e6a1493054d82b03cdc1f838bb3))
* **deps:** remove drizzle dependencies ([ad6a09a](https://github.com/arabold/docs-mcp-server/commit/ad6a09af93eb4d4732fd32b7d15286ae055c1144)), closes [#57](https://github.com/arabold/docs-mcp-server/issues/57)
* **scraper:** replace domcontentloaded with load event in Playwright ([9345152](https://github.com/arabold/docs-mcp-server/commit/9345152c4b1bb96dd37655337d6adb8fbe7b82e4)), closes [#62](https://github.com/arabold/docs-mcp-server/issues/62)
* silence JSDOM virtual console output ([61e41be](https://github.com/arabold/docs-mcp-server/commit/61e41bec2059ff95150d4f3720fffeacfe883198)), closes [#53](https://github.com/arabold/docs-mcp-server/issues/53)


### Features

* add initial JS sandbox utility and executor middleware ([#18](https://github.com/arabold/docs-mcp-server/issues/18)) ([19dea10](https://github.com/arabold/docs-mcp-server/commit/19dea109e6e52aeab8fc71bf4ca7de81eadfd4ff))
* **cli:** add --scrape-mode option and update README ([e8e4beb](https://github.com/arabold/docs-mcp-server/commit/e8e4beb57170baf3f509b8fd3c16dbaa1f5ae7e6))
* **cli:** add --scrape-mode option to fetch-url command ([cc6465a](https://github.com/arabold/docs-mcp-server/commit/cc6465a8bc6d99384fa8f15115f13a25f5045906))
* refactor content processing to middleware pipeline ([00f9a2f](https://github.com/arabold/docs-mcp-server/commit/00f9a2f28151639547d6435652fae919d46122c6)), closes [#17](https://github.com/arabold/docs-mcp-server/issues/17)
* **scraper:** add HtmlPlaywrightMiddleware for dynamic content rendering ([ee3118f](https://github.com/arabold/docs-mcp-server/commit/ee3118fb645bbde4fc879ae1058227507ead703a)), closes [#19](https://github.com/arabold/docs-mcp-server/issues/19)
* **scraper:** enable external script fetching in sandbox ([88b7e7a](https://github.com/arabold/docs-mcp-server/commit/88b7e7a430b89f735e6852937e5ab24debf8fa5d))
* **scraper:** replace JSDOM with Cheerio for HTML parsing ([5dd624a](https://github.com/arabold/docs-mcp-server/commit/5dd624ae965a221bcc6a9f18c72a7cbed7dc0eb5))

# [1.9.0](https://github.com/arabold/docs-mcp-server/compare/v1.8.0...v1.9.0) (2025-04-14)


### Bug Fixes

* **scraper:** use JSDOM title property for robust HTML title extraction ([dee350f](https://github.com/arabold/docs-mcp-server/commit/dee350f482428b7bc68192238aee1077eb6ace80)), closes [#41](https://github.com/arabold/docs-mcp-server/issues/41)


### Features

* increase default maxPages and add constants ([7b10eba](https://github.com/arabold/docs-mcp-server/commit/7b10ebaa3f610e53d8e2837702143f3f6d084bd2)), closes [#43](https://github.com/arabold/docs-mcp-server/issues/43)

# [1.8.0](https://github.com/arabold/docs-mcp-server/compare/v1.7.0...v1.8.0) (2025-04-14)


### Bug Fixes

* disabled removal of form elements ([3b6afde](https://github.com/arabold/docs-mcp-server/commit/3b6afde7b8c6796f65d6d4f09d86fb11e6a34b6a))
* preserve line breaks in pre tags ([b94b1e3](https://github.com/arabold/docs-mcp-server/commit/b94b1e3d4a56bd3ecf19b82c8d7b5c9abc715218))
* remove overly aggressive html filtering ([6c76509](https://github.com/arabold/docs-mcp-server/commit/6c76509b80dd48a5a21923b54f985c456c19d46a)), closes [#36](https://github.com/arabold/docs-mcp-server/issues/36)
* resolve store path correctly when not in project root ([49a3c1f](https://github.com/arabold/docs-mcp-server/commit/49a3c1ffb493a83c244708332dbe523e9c1e28ef))
* **search:** remove exactMatch flag from MCP API, improve internal handling ([e5cb8d1](https://github.com/arabold/docs-mcp-server/commit/e5cb8d16204ff01a1747d2db9e169b9ecd3c676a)), closes [#24](https://github.com/arabold/docs-mcp-server/issues/24)


### Features

* add fetch-url tool to CLI and MCP server ([604175f](https://github.com/arabold/docs-mcp-server/commit/604175f7d7abe1765ab419abe04340b1478230b2)), closes [#34](https://github.com/arabold/docs-mcp-server/issues/34)

# [1.7.0](https://github.com/arabold/docs-mcp-server/compare/v1.6.0...v1.7.0) (2025-04-11)


### Features

* **embeddings:** add support for multiple embedding providers ([e197bec](https://github.com/arabold/docs-mcp-server/commit/e197beca104192a77793c2a585b74bdfaa0da53e)), closes [#28](https://github.com/arabold/docs-mcp-server/issues/28)

# [1.6.0](https://github.com/arabold/docs-mcp-server/compare/v1.5.0...v1.6.0) (2025-04-11)


### Features

* **#26:** add environment variables to Dockerfile ([51b7059](https://github.com/arabold/docs-mcp-server/commit/51b7059147b846c5a85bebd6226ec63ef99b00e7)), closes [#26](https://github.com/arabold/docs-mcp-server/issues/26)
* **#26:** handle different embedding model dimensions via padding ([f712c9b](https://github.com/arabold/docs-mcp-server/commit/f712c9b0e43c2d90e2a9ad68f5cc1883af7b0a2a)), closes [#26](https://github.com/arabold/docs-mcp-server/issues/26)
* **#26:** support OpenAI API base URL and model name config ([66b70bb](https://github.com/arabold/docs-mcp-server/commit/66b70bba1b677cd20db85180d796b901583ca3b8)), closes [#26](https://github.com/arabold/docs-mcp-server/issues/26)

# [1.5.0](https://github.com/arabold/docs-mcp-server/compare/v1.4.5...v1.5.0) (2025-04-08)


### Bug Fixes

* **ci:** increase allowed footer line length ([afbc62c](https://github.com/arabold/docs-mcp-server/commit/afbc62ca14f65126e39718448563cd795e5b1d6d))


### Features

* **scraper:** enhance crawler controls with scope and redirect options ([45d0e93](https://github.com/arabold/docs-mcp-server/commit/45d0e93313ce5ff3eaddac848cd629ace9190418)), closes [#15](https://github.com/arabold/docs-mcp-server/issues/15)

## [1.4.5](https://github.com/arabold/docs-mcp-server/compare/v1.4.4...v1.4.5) (2025-04-08)


### Bug Fixes

* empty commit to trigger patch release ([ca62a92](https://github.com/arabold/docs-mcp-server/commit/ca62a92825c2073a79e5b02c98ddbef5b3d0fd17))

## [1.4.4](https://github.com/arabold/docs-mcp-server/compare/v1.4.3...v1.4.4) (2025-04-08)


### Bug Fixes

* empty commit to trigger patch release ([be47616](https://github.com/arabold/docs-mcp-server/commit/be47616ace3d30e222ef4f896287f231fab242be))
* empty commit to trigger patch release ([ff7f518](https://github.com/arabold/docs-mcp-server/commit/ff7f51845bf7778f3af0d5c25460eb53e052c649))
* **workflow:** update semantic-release configuration and output variables ([7725875](https://github.com/arabold/docs-mcp-server/commit/772587511f5fc2c193fcd69f41c0381dfff0df3c))
* **workflow:** update semantic-release configuration and output variables ([7628854](https://github.com/arabold/docs-mcp-server/commit/76288548a5688f68397add9abadb69837bb65b55))

## [1.4.4](https://github.com/arabold/docs-mcp-server/compare/v1.4.3...v1.4.4) (2025-04-08)


### Bug Fixes

* empty commit to trigger patch release ([ff7f518](https://github.com/arabold/docs-mcp-server/commit/ff7f51845bf7778f3af0d5c25460eb53e052c649))
* **workflow:** update semantic-release configuration and output variables ([7725875](https://github.com/arabold/docs-mcp-server/commit/772587511f5fc2c193fcd69f41c0381dfff0df3c))
* **workflow:** update semantic-release configuration and output variables ([7628854](https://github.com/arabold/docs-mcp-server/commit/76288548a5688f68397add9abadb69837bb65b55))

## [1.4.4](https://github.com/arabold/docs-mcp-server/compare/v1.4.3...v1.4.4) (2025-04-08)


### Bug Fixes

* **workflow:** update semantic-release configuration and output variables ([7725875](https://github.com/arabold/docs-mcp-server/commit/772587511f5fc2c193fcd69f41c0381dfff0df3c))
* **workflow:** update semantic-release configuration and output variables ([7628854](https://github.com/arabold/docs-mcp-server/commit/76288548a5688f68397add9abadb69837bb65b55))

## [1.4.3](https://github.com/arabold/docs-mcp-server/compare/v1.4.2...v1.4.3) (2025-04-08)


### Bug Fixes

* empty commit to trigger patch release ([50bb240](https://github.com/arabold/docs-mcp-server/commit/50bb24026abc1eba3b1a3fa011e04814ba5f3387))

## [1.4.2](https://github.com/arabold/docs-mcp-server/compare/v1.4.1...v1.4.2) (2025-04-08)


### Bug Fixes

* empty commit to trigger patch release ([c8f9a0f](https://github.com/arabold/docs-mcp-server/commit/c8f9a0fc58e47b6248e22614581e5583617de89d))

## [1.4.1](https://github.com/arabold/docs-mcp-server/compare/v1.4.0...v1.4.1) (2025-04-08)


### Bug Fixes

* **docs:** clarify docker volume creation in README ([03a58d6](https://github.com/arabold/docs-mcp-server/commit/03a58d69acd6da17ac24862d14ec9f2dc2e03cab))

# [1.4.0](https://github.com/arabold/docs-mcp-server/compare/v1.3.0...v1.4.0) (2025-04-08)


### Features

* **docker:** add configurable storage path & improve support ([9f35c54](https://github.com/arabold/docs-mcp-server/commit/9f35c54b7e50dcffba98fb96b0d316a018d6aad8))
* **store:** implement dynamic database path selection ([527d9f9](https://github.com/arabold/docs-mcp-server/commit/527d9f994969fa76aa3e585c6ecd98766870c592))

# [1.3.0](https://github.com/arabold/docs-mcp-server/compare/v1.2.1...v1.3.0) (2025-04-03)


### Features

* **search:** provide suggestions for unknown libraries ([d6628bb](https://github.com/arabold/docs-mcp-server/commit/d6628bb16bb321a19c4bdf109e361c1a54dca345)), closes [#12](https://github.com/arabold/docs-mcp-server/issues/12)

## [1.2.1](https://github.com/arabold/docs-mcp-server/compare/v1.2.0...v1.2.1) (2025-04-01)


### Bug Fixes

* **store:** escape FTS query to handle special characters ([bcf01a8](https://github.com/arabold/docs-mcp-server/commit/bcf01a84f7f82f6e9fe3ca3400e4d73b3a1ca165)), closes [#10](https://github.com/arabold/docs-mcp-server/issues/10)

# [1.2.0](https://github.com/arabold/docs-mcp-server/compare/v1.1.0...v1.2.0) (2025-03-30)


### Features

* **deploy:** add Smithery.ai deployment configuration ([3763168](https://github.com/arabold/docs-mcp-server/commit/3763168452bc02fd772149425229e16725bdc0de))

# [1.1.0](https://github.com/arabold/docs-mcp-server/compare/v1.0.0...v1.1.0) (2025-03-30)


### Features

* implement log level control via CLI flags ([b2f8b73](https://github.com/arabold/docs-mcp-server/commit/b2f8b73f1d0d63e58b76e92fd61bf9188014a563))

# 1.0.0 (2025-03-30)


### Bug Fixes

* Cleaned up log messages in MCP server ([db2c82e](https://github.com/arabold/docs-mcp-server/commit/db2c82ee31bdf658cc5b2019f2dce4f9053413cb))
* Cleaned up README ([0ac054e](https://github.com/arabold/docs-mcp-server/commit/0ac054e40bddfaeed75795dae23bc0614294f7ab))
* Fixed concatenation of chunks in the DocumentRetrieverService ([ae4ff6b](https://github.com/arabold/docs-mcp-server/commit/ae4ff6bf8247ba994ca83fda10ad02d78e7db920))
* Fixed several linter and formatter issues ([a2e4594](https://github.com/arabold/docs-mcp-server/commit/a2e45940eaaff935282604046c0488e2856c3c00))
* **package:** remove relative prefix from bin paths in package.json ([22f74e3](https://github.com/arabold/docs-mcp-server/commit/22f74e3925313e4e45e06ec7fcd4801e49e62bd6))
* removed unnecessary file extends in imports ([117903f](https://github.com/arabold/docs-mcp-server/commit/117903f415adfaf1c7d9f294317a8387b951a11c))
* restore progress callbacks in scraper ([0cebe97](https://github.com/arabold/docs-mcp-server/commit/0cebe9792b9766215bb3a9bb6196888c83851527))
* various linter issues and type cleanup ([14b02bd](https://github.com/arabold/docs-mcp-server/commit/14b02bd4b3a2f75d559651fc54e44fd460ff11ff))


### Code Refactoring

* improve type organization and method signatures ([da16170](https://github.com/arabold/docs-mcp-server/commit/da161702845c01fdd95b4d454c5e30f7d4eb3a28))


### Features

* Add comprehensive logging system ([ba8a6f1](https://github.com/arabold/docs-mcp-server/commit/ba8a6f112b1e5ccaf5ba71a3c7d02d4bb8a56eff))
* add configurable concurrency for web scraping ([f6c3baa](https://github.com/arabold/docs-mcp-server/commit/f6c3baab86673e8b082caca3d3761744062e1556))
* Add document ordering and URL tracking ([11ff1c8](https://github.com/arabold/docs-mcp-server/commit/11ff1c804c90650f14851dd71fd1233b09b9b12f))
* Add pipeline management tools to MCP server ([e01d31e](https://github.com/arabold/docs-mcp-server/commit/e01d31e39f47dcf8abe1749e5c43f0d46370ee8c))
* Add remove documents functionality ([642a320](https://github.com/arabold/docs-mcp-server/commit/642a32056986f07d9e52509e0738ba5a95f2b885))
* add store clearing before scraping ([9557014](https://github.com/arabold/docs-mcp-server/commit/9557014fee1c33354922c26acc3f0a0239b03665))
* Add vitest tests for MCP tools ([0c40c9e](https://github.com/arabold/docs-mcp-server/commit/0c40c9e13bc412c33efa84a07b7d3e60bd7f99de))
* Added .env.example to repository ([93c47f1](https://github.com/arabold/docs-mcp-server/commit/93c47f1d9e70dd7fc5a844698967883833e94b48))
* Added Cline custom instructions file ([aabb806](https://github.com/arabold/docs-mcp-server/commit/aabb80623fa41629eb1e3edd978c0961c93421cd))
* **ci:** configure automated releases with semantic-release ([8af5595](https://github.com/arabold/docs-mcp-server/commit/8af5595790c20bd7f9a5db44775c5158427c8092))
* enhance web scraping and error handling ([d3aa894](https://github.com/arabold/docs-mcp-server/commit/d3aa89490e82d79d05dba608e7991e54e9e91f60))
* Implement optional version handling and improve CLI ([9b41856](https://github.com/arabold/docs-mcp-server/commit/9b4185641af5eaa1a667afbe43bea8dfd5ac08ce))
* improve document processing and architecture docs ([b996d19](https://github.com/arabold/docs-mcp-server/commit/b996d1932d8061ae21f091eed578d281838e894b))
* Improve scraping, indexing, and URL handling ([3fc0931](https://github.com/arabold/docs-mcp-server/commit/3fc09313cd7dfc5091e71401adb9960ab582f7eb))
* improve search capabilities with PostgreSQL integration ([4e04aa7](https://github.com/arabold/docs-mcp-server/commit/4e04aa7cc694fa79bbcb36d685fa0fd81f524fe0))
* Make search tool version and limit optional and update dependencies ([bd83392](https://github.com/arabold/docs-mcp-server/commit/bd83392d7ad4e1b3aba59313ab6aaacfdb2b1837))
* Refactor scraper and introduce document processing pipeline ([6229f97](https://github.com/arabold/docs-mcp-server/commit/6229f97184211b9c561c95de4b4071b301cf8c90))
* **scraper:** implement configurable subpage scraping behavior ([1dc2a11](https://github.com/arabold/docs-mcp-server/commit/1dc2a118602187654603f8c81f49baf321d77e47))
* **scraper:** Implement local file scraping and refactor strategy pattern ([d058b48](https://github.com/arabold/docs-mcp-server/commit/d058b487eefb3073d6cd082ceeeded73d903e145))
* Simplify pipeline job data returned by MCP tools ([35c3279](https://github.com/arabold/docs-mcp-server/commit/35c327937f8e430795e5f5580501b3063dbcd2f0))
* switch to jsdom for DOM processing and improve database queries ([ba4768f](https://github.com/arabold/docs-mcp-server/commit/ba4768f2628cb6fdd3e55202132ee2877d68ab18))
* **tooling:** configure CI/CD, semantic-release, and commit hooks ([3d9b7a3](https://github.com/arabold/docs-mcp-server/commit/3d9b7a373d3bf1135a16f286ce32d8b74b36b637))
* Updated dependencies ([2b345c7](https://github.com/arabold/docs-mcp-server/commit/2b345c71a46e24dc8ab70335f00df85c7e1e8203))


### BREAKING CHANGES

* DocumentStore and VectorStoreService method signatures have changed

- Reorganize types across domains:
  * Move domain-specific types closer to their implementations
  * Keep only shared types in src/types/index.ts
  * Add domain prefixes to type names for clarity

- Standardize method signatures:
  * Replace filter objects with explicit library/version parameters
  * Make parameter order consistent across all methods
  * Update all tests to match new signatures

- Improve type naming:
  * Rename DocContent -> Document
  * Rename PageResult -> ScrapedPage
  * Rename ScrapeOptions -> ScraperOptions
  * Rename ScrapingProgress -> ScraperProgress
  * Rename SearchResult -> StoreSearchResult
  * Rename VersionInfo -> LibraryVersion
  * Rename SplitterOptions -> MarkdownSplitterOptions

The changes improve code organization, make dependencies clearer,
and provide a more consistent and explicit API across the codebase.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2025-09-17

### Added
- **CLI Integration for Board Deletion**: Added command-line interface support for board deletion feature
  - `--delete-board <boardName>` command to delete boards
  - `--dry-run` option for previewing changes
  - `--force` option to allow deletion of default board
  - `--default-board <boardName>` option to specify custom default board for orphaned items
  - Updated help text with examples and usage instructions

### Examples
```bash
tb --delete-board @old-project               # Delete board
tb --delete-board @old-project --dry-run     # Preview deletion
tb --delete-board "My Board" --force         # Force delete default board
```

## [0.4.0] - 2025-09-17

### Added
- **Board Deletion Feature**: New `deleteBoard()` method with comprehensive functionality
  - Soft delete approach: items are reassigned to other boards or default board
  - Input validation with proper error handling
  - Protection against deleting default board without `--force` option
  - Dry run support for previewing changes with `--dry-run` option
  - Custom default board specification with `--default-board` option
  - Detailed statistics and affected items tracking
  - Comprehensive render methods for user feedback

### Added (Testing Infrastructure)
- **Jest Testing Framework**: Complete test suite with 99 comprehensive tests
- **Test Coverage**: 
  - Board Operations (13 tests)
  - Item Management (19 tests) 
  - Storage Integrity (19 tests)
  - Edge Cases (28 tests)
  - Board Deletion (20 tests)
- **Test Utilities**: Robust mocking and test helpers
- **Test Scripts**: Added npm test scripts for unit testing and coverage

### Changed
- **Package Name**: Changed from `taskbook` to `@koenvanbelle/taskbook` for npm publishing
- **Version**: Bumped to 0.4.0 to reflect new features
- **Documentation**: Updated README with fork notice, installation instructions, and board deletion documentation

### Technical Details
- **API**: `deleteBoard(boardName, options)` method added to `src/taskbook.js`
- **Options**: Support for `{ dryRun: boolean, force: boolean, defaultBoard: string }`
- **Render Methods**: Added `invalidBoardName()`, `cannotDeleteDefaultBoard()`, `boardNotFound()`, `successDeleteBoard()`
- **Safety**: Multiple validation layers and non-destructive operations
- **Statistics**: Detailed tracking of affected items and reassignment statistics

### Fork Information
- **Original Author**: Klaudio Sinani (https://github.com/klaudiosinani/taskbook)
- **Fork Maintainer**: Koen Van Belle (https://github.com/VanBelleKoen)
- **Fork Reason**: Add board deletion functionality requested by users

---

*This changelog documents changes specific to this fork. For the original project's history, see the [original repository](https://github.com/klaudiosinani/taskbook).*

# Changelog

v1.0.7 - The `prune` option in `load()` is now false by default, like in `save()`, and `pruneEntries()` is now public.
v1.0.6 - Bugfix: Removed `console.log` statement.
v1.0.5 - Performance improvement: Skip encoding when reading file, if `encoding: null` is passed.
v1.0.4 - Bugfix: `fileHasChanged` now saves the changed file hash to the cache
v1.0.3 - Pruning entries is now optional on both `.load()` (default: true) and `.save()` (default: false).
v1.0.2 - Bugfix
v1.0.1 - Bugfix
v1.0.0 - Initial release

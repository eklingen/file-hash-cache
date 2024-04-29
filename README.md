
# File Hash Cache

Simple SHA-1 hash cache for tracking file changes.
Cache is saved to disk.

## Usage

Init the cache.

Optional arguments:
- `defaultKey = 'file'`; used throughout to categorize groups of files
- `cacheFile = '.hash-cache.json'`; filename of the cache on disk
- `cacheRoot = process.cwd()`; root where to place the cache on disk
- `projectRoot = process.cwd()`; root from where relative file paths are calculated

```javascript
import FileHashCache from '@eklingen/file-hash-cache'
const fileHashCache = new FileHashCache()
```

Update a file entry in the cache (existing cache will automatically be loaded from disk):

```javascript
fileHashCache.updateEntry(filename = 'readme.md', key = 'readme-files', encoding = 'utf-8')
```

And finally, save the cache to disk:

```javascript
fileHashCache.save()
```

## Other available methods

To force load the cache:
This loads the full cache. Pass a `key` to initialize the group if it doesn't exist yet in the cache.

```javascript
fileHashCache.load('readme-files')
```

To check if a file hash has changed as compared to the value in the cache:
This always compares file contents since the output can differ after writing it to a file.

```javascript
const hasChanged = fileHashCache.fileHasChanged(file = 'readme.md', key = 'readme-files', encoding = 'utf-8')
```

To compare the hash of two files, regardless of the cache:
This always compares file contents since the output can differ after writing it to a file.

```javascript
const isIdentical = fileHashCache.compareFiles(firstFilepath = 'somewhere/readme.md', secondFilepath = 'else/readme.md', encoding = 'utf-8')
```

## Dependencies

None.

---

Copyright (c) 2024 Elco Klingen. MIT License.

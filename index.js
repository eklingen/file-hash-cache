import { webcrypto } from 'node:crypto'
import { access, readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

// Check if path exists
export const pathExists = async (path = '') => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

// Sort keys by alphabetical order
const sortKeys = obj =>
  Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})

export default class FileHashCache {
  constructor(defaultKey = 'file', cacheFile = '.hash-cache.json', cacheRoot = process.cwd(), projectRoot = process.cwd()) {
    this.defaultKey = defaultKey
    this.defaultEncoding = 'utf-8'

    this.projectRoot = projectRoot
    this.cacheRoot = cacheRoot
    this.cacheFile = cacheFile
    this.cachePath = resolve(this.cacheRoot, this.cacheFile)

    this.encoder = new TextEncoder()
    this.hashCache = {}
  }

  // Load the cache from disk
  async load(key = null, prune = false) {
    if (!this.hashCache.length && (await pathExists(this.cachePath))) {
      const contents = await readFile(this.cachePath, { encoding: 'utf8' })

      // Wrap JSON.parse in try/catch because it will throw an error if the file is empty or malformed
      try {
        this.hashCache = JSON.parse(contents)
      } catch {
        this.hashCache = {}
      }

      if (prune) {
        await this.pruneEntries()
      }
    }

    // Create an empty entry for the key, if it doesn't exist
    if (key && !this.hashCache[key]) {
      this.hashCache[key] = {}
    }

    this.#sortEntries()
  }

  // Save the cache to disk
  async save(prune = false) {
    if (prune) {
      await this.pruneEntries()
    }

    this.#sortEntries()
    await writeFile(this.cachePath, JSON.stringify(this.hashCache, null, 2) + '\n', { encoding: 'utf8' })
  }

  // Get the SHA-1 hash of a file and update the cache
  async updateEntry(filepath = '', key = this.defaultKey, encoding = this.defaultEncoding) {
    if (!filepath || !(await pathExists(filepath))) {
      return false
    }

    const fileKey = relative(this.projectRoot, filepath)
    const fileHash = await this.#getFileHash(filepath, encoding)

    if (!this.hashCache[key]) {
      await this.load(key)
    }

    this.hashCache[key][fileKey] = fileHash

    return true
  }

  // Check if a file has changed since the last SHA-1 hash was calculated
  async fileHasChanged(filepath = '', key = this.defaultKey, encoding = this.defaultEncoding) {
    if (!this.hashCache[key]) {
      await this.load(key)
    }

    const fileKey = relative(this.projectRoot, filepath)
    const fileHash = await this.#getFileHash(filepath, encoding)
    const cachedHash = this.hashCache[key][fileKey] || ''
    const fileHasChanged = (fileHash !== cachedHash)

    if (fileHasChanged) {
      this.hashCache[key][fileKey] = fileHash
    }

    return fileHasChanged
  }

  // Compare two files by their SHA-1 hash
  async compareFiles(firstFilepath = '', secondFilepath = '', encoding = this.defaultEncoding) {
    if (!firstFilepath || !secondFilepath || !(await pathExists(firstFilepath)) || !(await pathExists(secondFilepath))) {
      return false
    }

    const firstFileContents = await readFile(firstFilepath, { encoding })
    const secondFileContents = await readFile(secondFilepath, { encoding })
    const firstFileHash = await this.#getContentHash(firstFileContents || '', encoding)
    const secondFileHash = await this.#getContentHash(secondFileContents || '', encoding)
    const filesAreIdentical = firstFileHash === secondFileHash

    return filesAreIdentical
  }

  // Prune stale entries from the cache
  async pruneEntries() {
    for (const key of Object.keys(this.hashCache)) {
      for (const fileKey of Object.keys(this.hashCache[key])) {
        if (!(await pathExists(resolve(this.projectRoot, fileKey)))) {
          delete this.hashCache[key][fileKey]
        }
      }
    }
  }

  // Sort cache entries alphabetically
  #sortEntries() {
    for (const key of Object.keys(this.hashCache)) {
      this.hashCache[key] = sortKeys(this.hashCache[key])
    }

    this.hashCache = sortKeys(this.hashCache)
  }

  // Get the SHA-1 hash of a string
  async #getContentHash(contents = '', encoding = this.defaultEncoding) {
    if (!contents || !contents.length) {
      return ''
    }

    const data = encoding ? this.encoder.encode(contents.toString(encoding)) : contents
    const arrayBuffer = await webcrypto.subtle.digest('SHA-1', data)
    const hash = Buffer.from(arrayBuffer).toString('base64')

    return hash
  }

  // Get the SHA-1 hash of a file
  async #getFileHash(filepath = '', encoding = this.defaultEncoding) {
    if (!filepath || !(await pathExists(filepath))) {
      return ''
    }

    const fileContents = await readFile(filepath, { encoding })

    if (!fileContents || !fileContents.length) {
      return ''
    }

    const contentHash = await this.#getContentHash(fileContents, encoding)

    return contentHash
  }
}

import { getAppStore } from 'jimu-core'

export class IndexedDBCache {
  private readonly dbName: string
  private readonly storeName: string
  private db: IDBDatabase = null

  private closed = false

  constructor (widgetId: string) {
    this.dbName = getDBName(widgetId)
    this.storeName = getStoreName()
  }

  init (): Promise<void> {
    if (!indexedDB) {
      return Promise.reject()
    }

    return Promise.resolve().then(() => {
      const request = indexedDB.open(this.dbName)

      request.onupgradeneeded = () => {
        const db = request.result

        // If the db doesn't contain the store, will create it.
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }

      return whenRequest(request)
    }).then((db: IDBDatabase) => {
      if (!this.closed) {
        this.db = db
      } else {
        db.close()
      }
    })
  }

  initialized (): boolean {
    return this.db != null
  }

  close (): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }

    this.closed = true
  }

  put (key: string, value: any): Promise<void> {
    if (this.db == null) {
      return Promise.reject('indexedb:not-initialized')
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    const request = store.put(value, key)

    return whenRequest(request).then()
  }

  putAll (data: Array<{ key: string, value: any }>): Promise<void> {
    if (this.db == null) {
      return Promise.reject('indexedb:not-initialized')
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite')
    data.forEach(d => {
      transaction.objectStore(this.storeName).put(d.value, d.key)
    })
    return whenTransaction(transaction)
  }

  get (key: string): Promise<any> {
    if (this.db == null) {
      return Promise.reject('indexedb:not-initialized')
    }

    const transaction = this.db.transaction([this.storeName], 'readonly')
    const store = transaction.objectStore(this.storeName)
    const request = store.get(key)

    return whenRequest(request)
  }

  getAll (): Promise<any[]> {
    if (this.db == null) {
      return Promise.reject('indexedb:not-initialized')
    }

    const transaction = this.db.transaction([this.storeName], 'readonly')
    const store = transaction.objectStore(this.storeName)
    const request = store.getAll()

    return whenRequest(request)
  }

  delete (key: string): Promise<void> {
    if (this.db == null) {
      return Promise.reject('indexedb:not-initialized')
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    const request = store.delete(key)

    return whenRequest(request)
  }

  deleteAll (keys: string[]): Promise<void> {
    if (this.db == null) {
      return Promise.reject('indexedb:not-initialized')
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite')
    keys.forEach(k => {
      transaction.objectStore(this.storeName).delete(k)
    })
    return whenTransaction(transaction)
  }

  clear (): Promise<void> {
    if (this.db == null) {
      return Promise.reject('indexedb:not-initialized')
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    const request = store.clear()

    return whenRequest(request)
  }

  destroy (): void {
    if (this.db) {
      this.db.deleteObjectStore(this.storeName)
    }
    this.close()
  }
}

// Change request to promise.
export function whenRequest<T> (request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (request.readyState === 'done') {
      if (request.error != null) {
        reject(request.error)
      } else {
        resolve(request.result)
      }
    } else {
      request.onsuccess = () => { resolve(request.result) }
      request.onerror = () => { reject(request.error) }
    }
  })
}

// Change transaction to promise.
export function whenTransaction (transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => { resolve() }
    transaction.onerror = () => { reject(transaction.error) }
    transaction.onabort = () => { reject(transaction.error) }
  })
}

export function getDBName (widgetId: string): string {
  const appId = window.jimuConfig?.isBuilder ? getAppStore().getState().appStateInBuilder?.appId : getAppStore().getState().appId
  return `exb-${appId}-add-data-${widgetId}-cache`
}

export function getStoreName (): string {
  return 'added-data'
}

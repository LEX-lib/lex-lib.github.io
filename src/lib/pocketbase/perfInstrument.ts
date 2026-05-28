import { pb } from './index'

const STORAGE_KEY = 'wallecx:perf-baseline'
const SESSION_KEY_PREFIX = 'wallecx:perf-session:'

interface PerfRecord {
  collection: string
  payloadBytes: number
  durationMs: number
  recordCount: number
  timestamp: string
}

export async function instrumentedGetFullList<T>(
  collection: string,
  options: Parameters<ReturnType<typeof pb.collection>['getFullList']>[0]
): Promise<T[]> {
  const markStart = `perf:${collection}:start`
  const markEnd = `perf:${collection}:end`
  const measureName = `perf:${collection}`

  performance.mark(markStart)
  const records = await pb.collection(collection).getFullList<T>(options)
  performance.mark(markEnd)
  const measure = performance.measure(measureName, markStart, markEnd)

  const durationMs = Math.round(measure.duration)
  const payloadBytes = JSON.stringify(records).length
  const recordCount = records.length

  const sessionFlag = SESSION_KEY_PREFIX + collection
  try {
    if (!sessionStorage.getItem(sessionFlag)) {
      sessionStorage.setItem(sessionFlag, '1')
      // T-36-01 mitigation: log NEVER includes record content, only counts + sizes
      console.info(
        `[wallecx:perf] ${collection}: ${recordCount} records, ${payloadBytes} bytes (proxy), ${durationMs}ms`
      )
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const stored: Record<string, PerfRecord[]> = raw ? JSON.parse(raw) : {}
        const ring = stored[collection] ?? []
        ring.push({ collection, payloadBytes, durationMs, recordCount, timestamp: new Date().toISOString() })
        if (ring.length > 5) ring.shift()
        stored[collection] = ring
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
      } catch {
        // Pitfall 6: localStorage may fail (private mode / quota) — non-fatal
      }
    }
  } catch {
    // sessionStorage may also throw in private mode — skip instrumentation silently
  }

  return records
}

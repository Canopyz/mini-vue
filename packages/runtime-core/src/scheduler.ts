const jobs: any[] = []
const preFlushJobs: any[] = []

let isFlushPending = false

const resolvedPromise: Promise<void> = Promise.resolve()
let currentFlushPromise: Promise<void> | null = null

export function nextTick(fn?: () => void) {
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(fn) : p
}

export function queuePreFlushJob(job) {
  preFlushJobs.push(job)
  queueFlushJobs()
}

export function queueJob(job) {
  if (!jobs.includes(job)) {
    jobs.push(job)
    queueFlushJobs()
  }
}

function queueFlushJobs() {
  if (isFlushPending) return
  isFlushPending = true

  nextTick(flushJobs)
}

function flushJobs() {
  isFlushPending = false

  flushPreFlushJobs()

  let job
  while ((job = jobs.shift())) {
    job && job()
  }
}

function flushPreFlushJobs() {
  let job
  while ((job = preFlushJobs.shift())) {
    job && job()
  }
}

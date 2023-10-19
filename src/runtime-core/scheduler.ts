const jobs: any[] = []

let isFlushPending = false

const resolvedPromise: Promise<void> = Promise.resolve()
let currentFlushPromise: Promise<void> | null = null

export function nextTick(fn?: () => void) {
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(fn) : p
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

  let job
  while ((job = jobs.shift())) {
    job && job()
  }
}

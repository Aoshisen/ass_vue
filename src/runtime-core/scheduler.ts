const queue: any[] = [];
const promiseResolve = Promise.resolve();

let isFlushPending = false;
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
}

function queueFlush() {
  //取出job放到微任务里面执行
  if (isFlushPending) {
    return;
  }
  isFlushPending = true;
  nextTick(flushJob);
}

function flushJob() {
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}

export function nextTick(fn) {
  return fn ? promiseResolve.then(fn) : promiseResolve;
}

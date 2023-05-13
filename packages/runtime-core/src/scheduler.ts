const queue: any[] = [];
const activePreFlushCbs: any[] = [];
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

export function queueFlushCb(job) {
  activePreFlushCbs.push(job);

  queueFlush()
}
function flushJob() {
  isFlushPending = false;
  //组件渲染之前
  flushPreFlushCbs();

  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}

function flushPreFlushCbs() {
  for (let i = 0; i < activePreFlushCbs.length; i++) {
    activePreFlushCbs[i]();
  }
}

export function nextTick(fn?) {
  return fn ? promiseResolve.then(fn) : promiseResolve;
}

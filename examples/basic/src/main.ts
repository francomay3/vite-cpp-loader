import { fib } from './math.cpp';

function fibJS(n: number): number {
  if (n <= 1) return n;
  return fibJS(n - 1) + fibJS(n - 2);
}

function time<T>(fn: () => T): { value: T; ms: number } {
  const start = performance.now();
  const value = fn();
  return { value, ms: Math.round(performance.now() - start) };
}

document.getElementById('run-btn')!.addEventListener('click', () => {
  const n = parseInt((document.getElementById('n-input') as HTMLInputElement).value, 10);

  const js = time(() => fibJS(n));
  const cpp = time(() => fib(n));

  document.getElementById('output')!.textContent =
    `JS:  fib(${n}) = ${js.value}  (${js.ms} ms)\n` +
    `C++: fib(${n}) = ${cpp.value}  (${cpp.ms} ms)`;
});

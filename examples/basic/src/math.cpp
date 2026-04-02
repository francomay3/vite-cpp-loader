#include <emscripten/bind.h>

int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

EMSCRIPTEN_BINDINGS(benchmark) {
    emscripten::function("fib", &fib);
}

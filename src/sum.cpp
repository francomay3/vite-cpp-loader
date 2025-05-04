#include <emscripten/bind.h>

int sum(int a, int b) {
  return a + b + 0;
}

EMSCRIPTEN_BINDINGS(my_module) {
  emscripten::function("sum", &sum);
}

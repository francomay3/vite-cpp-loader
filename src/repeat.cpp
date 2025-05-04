#include <emscripten/bind.h>

std::string repeat(std::string a, int b) {
  std::string result;
  for (int i = 0; i < b; i++) {
    result += a;
  }
  return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  emscripten::function("repeat", &repeat);
}

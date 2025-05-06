#include <emscripten/bind.h>
#include <string>
#include <vector>

int add(int a, int b) {
    return a + b;
}

std::string greet(const std::string& name) {
    return "Hello, " + name + "!";
}

std::string fibonacci(int n) {
    if (n <= 0) return "";
    
    std::string result = "0";
    if (n == 1) return result;
    
    result += ",1";
    int prev = 0;
    int curr = 1;
    for (int i = 2; i < n; i++) {
        int next = prev + curr;
        result += "," + std::to_string(next);
        prev = curr;
        curr = next;
    }
    return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("add", &add);
    emscripten::function("greet", &greet);
    emscripten::function("fibonacci", &fibonacci);
} 
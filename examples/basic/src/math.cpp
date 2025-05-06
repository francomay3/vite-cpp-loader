#include <emscripten/bind.h>
#include <string>
#include <vector>

int add(int a, int b) {
    return a + b;
}

std::string greet(const std::string& name) {
    return "Hello, " + name + "!";
}

std::vector<int> fibonacci(int n) {
    std::vector<int> result;
    if (n <= 0) return result;
    
    result.push_back(0);
    if (n == 1) return result;
    
    result.push_back(1);
    for (int i = 2; i < n; i++) {
        result.push_back(result[i-1] + result[i-2]);
    }
    return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("add", &add);
    emscripten::function("greet", &greet);
    emscripten::function("fibonacci", &fibonacci);
} 
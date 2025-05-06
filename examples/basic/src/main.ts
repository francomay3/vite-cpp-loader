import { add, greet, fibonacci } from './math.cpp';

const app = async () => {
  // awaited module functions
  console.log('Adding numbers:', await add(5, 3)); // 8
  console.log('Greeting:', await greet('World')); // "Hello, World!"
  console.log('Fibonacci sequence:', (await fibonacci(10)).split(',')); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34] 
}

app();
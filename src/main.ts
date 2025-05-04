
import { sum } from './sum.cpp';
import { repeat } from './repeat.cpp';

console.log(sum(2, 4));
console.log(repeat("Hello", 3));

// const modFactory = await import('./sum.cpp');
// const mod = await modFactory.default(); // instantiate the module
// console.log(mod.sum(2, 3));

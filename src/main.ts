const modFactory = await import('./sum.cpp');
const mod = await modFactory.default(); // instantiate the module
console.log(mod.sum(2, 3));

declare module '*.cpp' {
  const mod: {
  sum: (a: number, b: number) => number;
  };
  export default mod;
  export const sum: (a: number, b: number) => number;
}

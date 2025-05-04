declare module '*.cpp' {
  const mod: {
  repeat: (a: string, b: number) => string;
  };
  export default mod;
  export const repeat: (a: string, b: number) => string;
}

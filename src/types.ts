export interface CppFunction {
    name: string;
    returnType: string;
    parameters: Array<{ type: string; name: string }>;
  }
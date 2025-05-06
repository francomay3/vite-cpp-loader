// Function to convert C++ types to TypeScript types
export default function cppToTsType(cppType: string): string {
    const typeMap: Record<string, string> = {
      'int': 'number',
      'float': 'number',
      'double': 'number',
      'bool': 'boolean',
      'string': 'string',
      'std::string': 'string',
      'void': 'void',
      'char': 'string',
      'unsigned': 'number',
      'long': 'number',
      'short': 'number',
      'const string': 'string',
      'const std::string': 'string'
    };
    
    return typeMap[cppType] || 'any';
  }
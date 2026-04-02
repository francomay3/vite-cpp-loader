import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

function getEmscriptenRoot(): Promise<string | null> {
  return new Promise(resolve => {
    const child = spawn('em-config', ['EMSCRIPTEN_ROOT'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const chunks: Buffer[] = [];
    child.stdout?.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.on('error', () => resolve(null));
    child.on('close', code => {
      resolve(code === 0 ? Buffer.concat(chunks).toString().trim() : null);
    });
  });
}

export async function generateCppProperties(projectRoot: string): Promise<void> {
  const vscodeDir = path.join(projectRoot, '.vscode');
  const outPath = path.join(vscodeDir, 'c_cpp_properties.json');

  try {
    await fs.stat(outPath);
    return;
  } catch {
    // file doesn't exist, generate it
  }

  const emRoot = await getEmscriptenRoot();
  if (!emRoot) return;

  const includePath = path.join(emRoot, 'system', 'include').replace(/\\/g, '/');

  const config = {
    configurations: [
      {
        name: 'Emscripten',
        includePath: ['${workspaceFolder}/**', `${includePath}/**`],
        cppStandard: 'c++17',
        intelliSenseMode: 'clang-x64',
      },
    ],
    version: 4,
  };

  await fs.mkdir(vscodeDir, { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(config, null, 2) + '\n');
}

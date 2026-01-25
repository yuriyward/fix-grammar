import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function copyDir(src: string, dest: string): Promise<void> {
  await fs.cp(src, dest, { recursive: true, force: true, dereference: true });
}

async function adhocSignAppBundle(appBundlePath: string): Promise<void> {
  await execFileAsync('codesign', [
    '--force',
    '--deep',
    '--sign',
    '-',
    appBundlePath,
  ]);
}

type PackageResult = {
  platform: string;
  outputPaths: string[];
};

export async function signMacOSBundle(
  _forgeConfig: unknown,
  packageResult: PackageResult,
): Promise<void> {
  if (packageResult.platform !== 'darwin' && packageResult.platform !== 'mas') {
    return;
  }

  const appBundles: string[] = [];
  for (const outputPath of packageResult.outputPaths) {
    if (outputPath.endsWith('.app')) {
      appBundles.push(outputPath);
      continue;
    }

    try {
      const entries = await fs.readdir(outputPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (!entry.name.endsWith('.app')) continue;
        appBundles.push(path.join(outputPath, entry.name));
      }
    } catch (error: unknown) {
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string }).code
          : undefined;

      if (errorCode !== 'ENOTDIR') {
        throw error;
      }

      // Ignore if outputPath is not a directory (expected for .app bundles).
    }
  }

  await Promise.all(
    appBundles.map((bundlePath) => adhocSignAppBundle(bundlePath)),
  );
}

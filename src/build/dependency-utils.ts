import * as fs from 'node:fs/promises';
import path from 'node:path';
import { NATIVE_DEPS } from '../shared/config/native-deps';
import { copyDir } from './file-utils';

type PackageJson = {
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type DependencyToCopy = {
  name: string;
  optional: boolean;
};

function packageDepsToCopy(
  packageName: string,
  packageJson: PackageJson,
  platform: string,
): DependencyToCopy[] {
  const dependencies = Object.keys(packageJson.dependencies ?? {});
  const optionalDependencies = Object.keys(
    packageJson.optionalDependencies ?? {},
  );

  if (packageName === '@nut-tree-fork/libnut') {
    const platformLibnut =
      platform === 'linux'
        ? '@nut-tree-fork/libnut-linux'
        : platform === 'win32'
          ? '@nut-tree-fork/libnut-win32'
          : '@nut-tree-fork/libnut-darwin';

    return dependencies
      .filter((dep) => dep === platformLibnut)
      .map((name) => ({ name, optional: false }));
  }

  const required = dependencies.map((name) => ({ name, optional: false }));
  const requiredSet = new Set(dependencies);
  const optional = optionalDependencies
    .filter((name) => !requiredSet.has(name))
    .map((name) => ({ name, optional: true }));

  return [...required, ...optional];
}

async function copyNodeModulePackage(
  projectDir: string,
  buildPath: string,
  packageName: string,
  platform: string,
  copied: Set<string>,
  inProgress: Set<string>,
  isOptional: boolean,
): Promise<void> {
  if (copied.has(packageName) || inProgress.has(packageName)) return;
  inProgress.add(packageName);

  const packagePathParts = packageName.split('/');
  const src = path.join(projectDir, 'node_modules', ...packagePathParts);
  const dest = path.join(buildPath, 'node_modules', ...packagePathParts);

  try {
    try {
      await fs.stat(src);
    } catch {
      if (isOptional) return;
      throw new Error(
        `Missing runtime dependency ${JSON.stringify(packageName)} at ${JSON.stringify(src)}.`,
      );
    }

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await copyDir(src, dest);
    copied.add(packageName);

    const packageJsonPath = path.join(src, 'package.json');
    const packageJson = JSON.parse(
      await fs.readFile(packageJsonPath, 'utf8'),
    ) as PackageJson;
    const deps = packageDepsToCopy(packageName, packageJson, platform);
    await Promise.all(
      deps.map(({ name, optional }) =>
        copyNodeModulePackage(
          projectDir,
          buildPath,
          name,
          platform,
          copied,
          inProgress,
          optional,
        ),
      ),
    );
  } finally {
    inProgress.delete(packageName);
  }
}

function nutNativeRuntimePackages(platform: string): readonly string[] {
  switch (platform) {
    case 'darwin':
    case 'mas':
      return NATIVE_DEPS.darwin;
    case 'linux':
      return NATIVE_DEPS.linux;
    case 'win32':
      return NATIVE_DEPS.win32;
    default:
      return [];
  }
}

export async function copyNativeModules(
  _forgeConfig: unknown,
  buildPath: string,
  _electronVersion: string,
  platform: string,
): Promise<void> {
  const packages = nutNativeRuntimePackages(platform);
  if (packages.length === 0) return;

  const projectDir = process.cwd();
  const copied = new Set<string>();
  const inProgress = new Set<string>();
  await Promise.all(
    packages.map((packageName) =>
      copyNodeModulePackage(
        projectDir,
        buildPath,
        packageName,
        platform,
        copied,
        inProgress,
        false,
      ),
    ),
  );
}

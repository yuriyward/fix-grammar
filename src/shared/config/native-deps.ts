export const NATIVE_DEPS = {
  darwin: [
    '@nut-tree-fork/shared',
    '@nut-tree-fork/libnut',
    '@nut-tree-fork/libnut-darwin',
    '@nut-tree-fork/node-mac-permissions',
    'bindings',
    'file-uri-to-path',
  ],
  linux: [
    '@nut-tree-fork/shared',
    '@nut-tree-fork/libnut',
    '@nut-tree-fork/libnut-linux',
    'bindings',
    'file-uri-to-path',
  ],
  win32: [
    '@nut-tree-fork/shared',
    '@nut-tree-fork/libnut',
    '@nut-tree-fork/libnut-win32',
    'bindings',
    'file-uri-to-path',
  ],
} as const;

export const NATIVE_EXTERNAL_DEPS = [
  '@nut-tree-fork/libnut',
  '@nut-tree-fork/libnut-darwin',
  '@nut-tree-fork/libnut-linux',
  '@nut-tree-fork/libnut-win32',
] as const;

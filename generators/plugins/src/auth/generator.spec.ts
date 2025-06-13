import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import generator from './generator';

vi.mock('fs');

const mockFiles = {
  '/Users/justinhandley/IdeaProjects/muzebook/libs/api/custom/src/lib/plugins/auth/file.txt': 'MuseBook is cool',
};

const GENERATED_FILES = [
  'libs/api/custom/plugins/auth/auth.service.ts',
  'libs/api/custom/plugins/auth/auth.resolver.ts',
  'libs/api/custom/plugins/auth/auth.module.ts',
  'libs/api/custom/plugins/auth/auth.helper.ts',
  'libs/api/custom/plugins/auth/dto/index.ts',
  'libs/api/custom/plugins/auth/dto/register.input.ts',
  'libs/api/custom/plugins/auth/dto/reset-password.input.ts',
  'libs/api/custom/plugins/auth/dto/forgot-password.input.ts',
  'libs/api/custom/plugins/auth/dto/login.input.ts',
  'libs/api/custom/plugins/auth/dto/user-create.input.ts',
  'libs/api/custom/plugins/auth/decorators/ctx-user.decorator.ts',
  'libs/api/custom/plugins/auth/strategies/jwt.strategy.ts',
  'libs/api/custom/plugins/auth/models/user-token.ts',
  'libs/api/custom/plugins/auth/templates/password-reset-email.template.ts',
];

function setupFsMock() {
  vi.mocked(fs.existsSync).mockImplementation((p) => !!mockFiles[p as string] || p === '/Users/justinhandley/IdeaProjects/muzebook/libs/api/custom/src/lib/plugins/auth' || p === 'libs/plugins/auth');
  vi.mocked(fs.readdirSync).mockImplementation((p) => (p === '/Users/justinhandley/IdeaProjects/muzebook/libs/api/custom/src/lib/plugins/auth' ? ['file.txt'] : []) as any);
  vi.mocked(fs.statSync).mockImplementation((p) => ({ isDirectory: () => false } as any));
  vi.mocked(fs.readFileSync).mockImplementation((p) => mockFiles[p as string] || '');
  vi.mocked(fs.writeFileSync).mockImplementation((p, content) => { mockFiles[p as string] = content as string; });
  vi.mocked(fs.mkdirSync).mockImplementation(() => undefined as unknown as string);
}

describe('auth-generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate all expected auth files', async () => {
    await generator(tree, { namespace: 'MyApp' });
    for (const file of GENERATED_FILES) {
      expect(tree.exists(file)).toBe(true);
    }
  });
}); 
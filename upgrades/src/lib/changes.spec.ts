import { describe, expect, it } from 'vitest';
import { patchPaths } from './changes';

describe('patchPaths', () => {
  it('lists modified, created, deleted and renamed paths', () => {
    const diff = [
      'diff --git a/src/app.ts b/src/app.ts',
      'index 1111111..2222222 100644',
      '--- a/src/app.ts',
      '+++ b/src/app.ts',
      '@@ -1 +1 @@',
      '-old',
      '+new',
      'diff --git a/docs/new.md b/docs/new.md',
      'new file mode 100644',
      'index 0000000..3333333',
      '--- /dev/null',
      '+++ b/docs/new.md',
      '@@ -0,0 +1 @@',
      '+hello',
      'diff --git a/gone.txt b/gone.txt',
      'deleted file mode 100644',
      'index 4444444..0000000',
      '--- a/gone.txt',
      '+++ /dev/null',
      '@@ -1 +0,0 @@',
      '-bye',
      'diff --git a/lib/old.ts b/lib/renamed.ts',
      'similarity index 100%',
      'rename from lib/old.ts',
      'rename to lib/renamed.ts',
      '',
    ].join('\n');
    expect(patchPaths(diff).sort()).toEqual(['docs/new.md', 'gone.txt', 'lib/old.ts', 'lib/renamed.ts', 'src/app.ts']);
  });

  it('reads quoted paths, paths with spaces, and mode-only changes', () => {
    const diff = [
      'diff --git "a/docs/\\303\\274ber.md" "b/docs/\\303\\274ber.md"',
      '--- "a/docs/\\303\\274ber.md"',
      '+++ "b/docs/\\303\\274ber.md"',
      '@@ -1 +1 @@',
      '-a',
      '+b',
      'diff --git a/my notes.md b/my notes.md',
      '--- a/my notes.md\t',
      '+++ b/my notes.md\t',
      '@@ -1 +1 @@',
      '-a',
      '+b',
      'diff --git a/bin/run b/bin/run',
      'old mode 100644',
      'new mode 100755',
      '',
    ].join('\n');
    expect(patchPaths(diff).sort()).toEqual(['bin/run', 'docs/über.md', 'my notes.md']);
  });

  it('strips whatever prefixes the diff uses, as git apply -p1 does', () => {
    const diff = [
      'diff --git old/docs/notes.md new/docs/notes.md',
      '--- old/docs/notes.md',
      '+++ new/docs/notes.md',
      '@@ -1 +1 @@',
      '-a',
      '+b',
      'diff --git x/bin/my tool y/bin/my tool',
      'old mode 100644',
      'new mode 100755',
      '',
    ].join('\n');
    expect(patchPaths(diff).sort()).toEqual(['bin/my tool', 'docs/notes.md']);
  });

  it('never mistakes hunk lines for headers', () => {
    const diff = [
      'diff --git a/README.md b/README.md',
      '--- a/README.md',
      '+++ b/README.md',
      '@@ -1,2 +1,2 @@',
      '--- a/not-a-file.md',
      '+++ b/not-a-file-either.md',
      ' context',
      '',
    ].join('\n');
    expect(patchPaths(diff)).toEqual(['README.md']);
  });

  it('drops paths matching the excludes', () => {
    const diff = [
      'diff --git a/.nestled/upgrade-log.yaml b/.nestled/upgrade-log.yaml',
      '--- a/.nestled/upgrade-log.yaml',
      '+++ b/.nestled/upgrade-log.yaml',
      '@@ -1 +1 @@',
      '-a',
      '+b',
      'diff --git a/src/a.ts b/src/a.ts',
      '--- a/src/a.ts',
      '+++ b/src/a.ts',
      '@@ -1 +1 @@',
      '-a',
      '+b',
      '',
    ].join('\n');
    expect(patchPaths(diff, ['.nestled/**'])).toEqual(['src/a.ts']);
  });
});

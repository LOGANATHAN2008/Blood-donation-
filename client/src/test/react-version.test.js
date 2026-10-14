import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('React Version & Duplication Check', () => {
  it('asserts npm ls react react-dom has exactly one version without duplicates', () => {
    const clientDir = path.resolve(__dirname, '../../');
    const output = execSync('npm ls react react-dom --json', {
      cwd: clientDir,
      encoding: 'utf-8',
    });

    const parsed = JSON.parse(output);
    expect(parsed.dependencies).toBeDefined();

    const reactDep = parsed.dependencies.react;
    const reactDomDep = parsed.dependencies['react-dom'];

    expect(reactDep).toBeDefined();
    expect(reactDomDep).toBeDefined();

    // Both must be version 18.3.1
    expect(reactDep.version).toBe('18.3.1');
    expect(reactDomDep.version).toBe('18.3.1');

    function collectVersions(tree, pkgName, versions = new Set()) {
      if (!tree || typeof tree !== 'object') return versions;
      if (tree.dependencies) {
        for (const [name, dep] of Object.entries(tree.dependencies)) {
          if (name === pkgName && dep.version) {
            versions.add(dep.version);
          }
          collectVersions(dep, pkgName, versions);
        }
      }
      return versions;
    }

    const reactVersions = Array.from(collectVersions(parsed, 'react'));
    const reactDomVersions = Array.from(collectVersions(parsed, 'react-dom'));

    // Assert strictly single version across the entire tree
    expect(reactVersions).toEqual(['18.3.1']);
    expect(reactDomVersions).toEqual(['18.3.1']);
  }, 20000);
});

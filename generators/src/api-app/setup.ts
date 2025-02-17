import { Tree } from '@nx/devkit';
import { execSync } from 'child_process';

export default async function(tree: Tree) {
  // First run the init generator to install dependencies
  execSync('nx g @nestled/generators:api-app-init', { stdio: 'inherit' });
  
  // Then run the main generator
  execSync('nx g @nestled/generators:api-app', { stdio: 'inherit' });
} 
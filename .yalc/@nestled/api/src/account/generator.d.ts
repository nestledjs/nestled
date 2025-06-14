import { GeneratorCallback, Tree } from '@nx/devkit';
import { ApiAccountGeneratorSchema } from './schema';
export default function generateLibraries(tree: Tree, options?: ApiAccountGeneratorSchema): Promise<GeneratorCallback>;

import { GeneratorCallback, Tree } from '@nx/devkit';
import { ApiCoreGeneratorSchema } from './schema';
export default function generateLibraries(tree: Tree, options?: ApiCoreGeneratorSchema): Promise<GeneratorCallback>;

import { Tree } from '@nx/devkit';
import { ApiPrismaGeneratorSchema } from './schema';
export default function generateLibraries(tree: Tree, options?: ApiPrismaGeneratorSchema): Promise<() => void>;

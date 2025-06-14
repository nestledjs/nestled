import { Tree } from '@nx/devkit';
import { ApiConfigGeneratorSchema } from './schema';
export default function generateLibraries(tree: Tree, options?: ApiConfigGeneratorSchema): Promise<() => void>;

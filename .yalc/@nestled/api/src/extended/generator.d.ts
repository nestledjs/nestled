import { Tree } from '@nx/devkit';
import { GenerateExtendedGeneratorSchema } from './schema';
export default function (tree: Tree, schema: GenerateExtendedGeneratorSchema): Promise<() => void>;

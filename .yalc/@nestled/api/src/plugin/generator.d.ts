import { Tree } from '@nx/devkit';
import { GeneratePluginGeneratorSchema } from './schema';
export default function (tree: Tree, schema: GeneratePluginGeneratorSchema): Promise<() => void>;

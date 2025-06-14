import { Tree } from '@nx/devkit';
interface Schema {
    [key: string]: unknown;
}
export default function (tree: Tree, schema: Schema): Promise<void>;
export {};

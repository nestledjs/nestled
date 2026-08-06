export interface GenerateCrudGeneratorSchema {
  name: string;
  directory: string;
  model: string;
  plural: string;
  description?: string;
  overwrite?: boolean;
  /** Relation nesting levels to emit in generated filter inputs. Defaults to 3. */
  filterDepth?: number;
}

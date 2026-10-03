export interface WorkspaceSetupGeneratorSchema {
  /**
   * Project name (lowercase with dashes, e.g. my-project). Replaces the
   * template placeholder name across the workspace's files.
   */
  name: string
}

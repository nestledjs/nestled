export declare const REPO_CONFIG_PATH: string
export declare const DEFAULT_SELECT_FILE_SUFFIXES: string[]
export declare const readRepoConfig: (cwd?: string) => {
  selectFileSuffixes: string[]
  noSelectFiles?: string
}
/** Exit code for a verifier that examined nothing: 0 if declared, 1 if not, 2 on a broken config. */
export declare const reportNothingChecked: (tool: string, cwd?: string) => number

declare module 'schema' {
  export interface ProjectConfigSchema {
    overwritePrettier: boolean
    generateEnv: boolean
    generateDocker: boolean
  }
}

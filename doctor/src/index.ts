/**
 * The analysis primitives, exported so they can be unit-tested and so a future check can build on
 * them. The CHECKS themselves are not exported: they are run through the bins, so every repo runs
 * the same rules rather than assembling its own subset.
 */
export * from './doctor-access-policy-analysis'
export * from './doctor-auth-analysis'
export * from './doctor-crud-boundary-analysis'
export * from './doctor-generated-crud-posture'
export * from './doctor-module-analysis'
export * from './doctor-sdk-contract-analysis'
export * from './doctor-source-analysis'

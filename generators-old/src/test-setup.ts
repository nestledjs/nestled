// Add performance API polyfill for tests
if (typeof performance === 'undefined') {
  const createPerformanceEntry = (
    name: string,
    entryType: string,
    startTime: number,
    duration: number = 0,
  ): PerformanceEntry => ({
    name,
    entryType,
    startTime,
    duration,
    toJSON: () => ({ name, entryType, startTime, duration }),
  })

  // @ts-expect-error - We're intentionally polyfilling performance
  global.performance = {
    now: () => Date.now(),
    mark: (name: string, markOptions?: PerformanceMarkOptions): PerformanceMark => {
      console.debug(`Mark: ${name}`)
      return createPerformanceEntry(name, 'mark', Date.now()) as PerformanceMark
    },
    measure: (
      name: string,
      startOrMeasureOptions?: string | PerformanceMeasureOptions,
      endMark?: string,
    ): PerformanceMeasure => {
      console.debug(`Measure: ${name}`, { startOrMeasureOptions, endMark })
      return createPerformanceEntry(name, 'measure', Date.now()) as PerformanceMeasure
    },
    clearMarks: (name?: string) => {
      console.debug(`Clear marks: ${name || 'all'}`)
    },
    clearMeasures: (name?: string) => {
      console.debug(`Clear measures: ${name || 'all'}`)
    },
    getEntries: () => [] as PerformanceEntry[],
    getEntriesByName: (name: string) => [] as PerformanceEntry[],
    getEntriesByType: (type: string) => [] as PerformanceEntry[],
  }
}

// Add other global mocks or polyfills as needed

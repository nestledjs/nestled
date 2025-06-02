// Add performance API polyfill for tests
if (typeof performance === 'undefined') {
  // @ts-expect-error - We're intentionally polyfilling performance
  global.performance = {
    now: () => Date.now(),
    mark: (name: string) => { console.debug(`Mark: ${name}`); },
    measure: (name: string, startMark?: string, endMark?: string) => { 
      console.debug(`Measure: ${name}`, { startMark, endMark }); 
    },
    clearMarks: (name?: string) => { console.debug(`Clear marks: ${name || 'all'}`); },
    clearMeasures: (name: string) => { console.debug(`Clear measure: ${name}`); },
    getEntries: () => [],
    getEntriesByName: (_name: string) => [],
    getEntriesByType: (_type: string) => [],
  };
}

// Add other global mocks or polyfills as needed

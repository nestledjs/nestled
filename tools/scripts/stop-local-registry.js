module.exports = () => {
  if (global.stopLocalRegistry) {
    global.stopLocalRegistry();
  }
}; 
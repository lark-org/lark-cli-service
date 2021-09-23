/* eslint-disable */

export function logVersion() {
  // eslint-disable-next-line no-underscore-dangle
  if (__DEV__) {
    return
  }
  try {
    const isChrome = /Chrome/.test(window.navigator.userAgent)
    const log = window.console.log
    // eslint-disable-next-line no-unused-expressions
    isChrome &&
      log(
        '%cLark%c CLI Service',
        "font-family:'SF Pro SC', helvetica; text-shadow: 3px 3px 2px rgba(128, 125, 124, 1);font-size:4em;color:#6CCE64;",
        "text-transform: capitalize;font-family:'SF Pro SC', helvetica;"
      )
    log('App Version v%s', VERSION)
    log('CLI Version: v%s', CLI_VERSION)
    log('Build Time: %s', BUILD_TIME)
  } catch (error) {}
}
logVersion()

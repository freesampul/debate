// Saves native fetch before any polyfill can overwrite it, then restores it.
// Import this at the very top of app/_layout.tsx (before all other imports).
const nativeFetch = globalThis.fetch
const nativeHeaders = globalThis.Headers
const nativeRequest = globalThis.Request
const nativeResponse = globalThis.Response

if (nativeFetch) {
  globalThis.fetch = nativeFetch
}
if (nativeHeaders) {
  globalThis.Headers = nativeHeaders
}
if (nativeRequest) {
  globalThis.Request = nativeRequest
}
if (nativeResponse) {
  globalThis.Response = nativeResponse
}

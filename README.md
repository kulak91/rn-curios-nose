# rn-curious-nose
Insights into React Native re-renders

> [!WARNING]
> Editing node_modules is a big NONO. Use only out of curiosity and at your own risk.

### Why?
We’ve all read about how hooks work and how re-renders happen, but sometimes it's not clear whether the reference to an object remains the same when it comes from Redux or from context. This check simply adds logs to the React function areHookInputsEqual in dev mode, allowing you to visually see how React compares dependencies in your app for any hook with array deps.

### How to use?
- Find any react native project
- Install node_modules
- Create `find_deps_differ.js` and copy `index.js` content from this repo inside of it.
- Launch `node find_deps_differ.js` to modify `ReactNativeRenderer-dev.js` `areHookInputsEqual` function.
- Add `_debug_` string to the react hook deps array
- Watch console output

### Demo

![Demo output](https://github.com/kulak91/rn-curious-nose/blob/main/assets/intro.gif)

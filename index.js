const fs = require('fs');
const path = require('path');

const repoDir = __dirname;
const nodeModulesDir = path.join(repoDir, 'node_modules');
const reactNativeDir = path.join(nodeModulesDir, 'react-native');
const searchDir = path.join(__dirname, 'node_modules', 'react-native');
const searchTerm = 'function areHookInputsEqual(nextDeps, prevDeps) {';
const searchHelperFunction = 'function isMyHook(deps) {';
const searchFile = 'ReactNativeRenderer-dev.js';
let shouldAddHelperFunction = true;
const HELPER_FUNCTION_TEMPLATE = `    function isMyHook(deps) {
      if (deps !== null && Array.isArray(deps) && deps.length > 0 && deps[0] === '_debug_') {
        return true;
      }

      return false;
    }`;
const MODIFIED_OUTPUT = `    function areHookInputsEqual(nextDeps, prevDeps) {
      let isMine = isMyHook(nextDeps);
      isMine && console.log('************')
      isMine && console.log('ReacNativeRenderer-dev.js comparing deps in %s', currentHookNameInDev);

      if (prevDeps)
      {
        if (ignorePreviousDependencies) {
          // Only true when this component is being hot reloaded.
          if (isMine) {
            console.log('Rerender %s because it is a hot reload', currentHookNameInDev);
          }
          return false;
        }
      }

      if (prevDeps === null) {
        {
          error(
            "%s received a final argument during this render, but not during " +
              "the previous render. Even though the final argument is optional, " +
              "its type cannot change between renders.",
            currentHookNameInDev
          );
        }

        return false;
      }

      {
        // Don't bother comparing lengths in prod because these arrays should be
        // passed inline.
        if (nextDeps.length !== prevDeps.length) {
          error(
            "The final argument passed to %s changed size between renders. The " +
            "order and size of this array must remain constant.\\n\\n" +
            "Previous: %s\\n" +
            "Incoming: %s",
            currentHookNameInDev,
            "[" + prevDeps.join(", ") + "]",
            "[" + nextDeps.join(", ") + "]"
          );
        }
      } // $FlowFixMe[incompatible-use] found when upgrading Flow

      for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        if (objectIs(nextDeps[i], prevDeps[i])) {
          if(isMine) {
            console.log({ status: 'EQUAL', 'prev': prevDeps[i], 'next': nextDeps[i] });
          }
          continue;
        }

        if(isMine) {
          console.log({ status: 'NOT EQUAL', 'prev': prevDeps[i], 'next': nextDeps[i] });
        }

        return false;
      }

      if(isMine) {
        console.log('No reason to rerender %s, because deps are equal', currentHookNameInDev);
      }

      return true;
    }`;

function checkRequiredDirectories() {
  if (!fs.existsSync(nodeModulesDir)) {
    console.log('node_modules directory not found');
    process.exit(0)
  }

  if (!fs.existsSync(reactNativeDir)) {
    console.log('react-native directory not found inside node_modules');
    process.exit(0)
  }
}

function searchFiles(dir) {
  checkRequiredDirectories()
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) return console.error(`Error reading directory: ${err.message}`);

    files.forEach(file => {
      const filePath = path.join(dir, file.name);

      if (file.isDirectory()) {
        searchFiles(filePath);
      } else if (file.isFile()) {
        searchInFile(filePath);
      }
    });
  });
}

function searchInFile(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return console.error(`Error reading file: ${err.message}`);
    if (path.basename(filePath) !== searchFile) return;

    const lines = data.split('\n');
    let isInsideFunction = false;
    let braceCount = 0;
    let startLine = -1;
    let endLine = -1;

    lines.forEach((line, index) => {
      if (line.includes(searchHelperFunction)) {
        shouldAddHelperFunction = false;
      }
      if (!isInsideFunction && line.includes(searchTerm)) {
        console.log(`Match found in: ${filePath} at line ${index + 1}`);
        isInsideFunction = true;
        startLine = index;
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
      } else if (isInsideFunction) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0) {
          endLine = index;
          isInsideFunction = false;
        }
      }
    });

    if (startLine !== -1 && endLine !== -1) {
      editFile(filePath, lines, startLine, endLine);
    }
  });
}

function editFile(filePath, lines, startLine, endLine) {
  const modifiedFunction = MODIFIED_OUTPUT;

  const newContent = [
    ...lines.slice(0, startLine),
    ...(shouldAddHelperFunction ? [HELPER_FUNCTION_TEMPLATE] : []),
    modifiedFunction,
    ...lines.slice(endLine + 1),
  ].join('\n');

  fs.writeFile(filePath, newContent, 'utf8', err => {
    if (err) {
      console.error(`Error writing file: ${err.message}`);
    } else {
      console.log(`File successfully modified: ${filePath}`);
    }
  });
}

searchFiles(searchDir);

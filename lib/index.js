(function(e, a) { for(var i in a) e[i] = a[i]; if(a.__esModule) Object.defineProperty(e, "__esModule", { value: true }); }(exports,
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const coc_nvim_1 = __webpack_require__(1);
const utils_1 = __webpack_require__(2);
const child_process_1 = __webpack_require__(3);
const rustywind_1 = __webpack_require__(4);
const config = coc_nvim_1.workspace.getConfiguration();
const configRegex = config.get('headwind.classRegex') || {};
const sortOrder = config.get('headwind.defaultSortOrder');
const customTailwindPrefixConfig = config.get('headwind.customTailwindPrefix');
const customTailwindPrefix = typeof customTailwindPrefixConfig === 'string' ? customTailwindPrefixConfig : '';
const shouldRemoveDuplicatesConfig = config.get('headwind.removeDuplicates');
const shouldRemoveDuplicates = typeof shouldRemoveDuplicatesConfig === 'boolean' ? shouldRemoveDuplicatesConfig : true;
const shouldPrependCustomClassesConfig = config.get('headwind.prependCustomClasses');
const shouldPrependCustomClasses = typeof shouldPrependCustomClassesConfig === 'boolean' ? shouldPrependCustomClassesConfig : false;
function activate(context) {
    const disposable = coc_nvim_1.commands.registerCommand('headwind.sortTailwindClasses', async () => {
        const document = await coc_nvim_1.workspace.document;
        const editorText = document.textDocument.getText();
        const editorLangId = document.textDocument.languageId;
        const classWrapperRegex = new RegExp(configRegex[editorLangId] || configRegex['html'], 'gi');
        let classWrapper;
        while ((classWrapper = classWrapperRegex.exec(editorText)) !== null) {
            const wrapperMatch = classWrapper[0];
            const valueMatchIndex = classWrapper.findIndex((match, idx) => idx !== 0 && match);
            const valueMatch = classWrapper[valueMatchIndex];
            const startPosition = classWrapper.index + wrapperMatch.lastIndexOf(valueMatch);
            const endPosition = startPosition + valueMatch.length;
            const range = coc_nvim_1.Range.create(document.textDocument.positionAt(startPosition), document.textDocument.positionAt(endPosition));
            const options = {
                shouldRemoveDuplicates,
                shouldPrependCustomClasses,
                customTailwindPrefix,
            };
            // edit.replace(range, sortClassString(valueMatch, Array.isArray(sortOrder) ? sortOrder : [], options));
            document.applyEdits([
                { range, newText: utils_1.sortClassString(valueMatch, Array.isArray(sortOrder) ? sortOrder : [], options) },
            ]);
        }
    });
    const runOnProject = coc_nvim_1.commands.registerCommand('headwind.sortTailwindClassesOnWorkspace', () => {
        const workspaceFolder = coc_nvim_1.workspace.workspaceFolders || [];
        if (workspaceFolder[0]) {
            const workspacePath = coc_nvim_1.Uri.parse(workspaceFolder[0].uri).fsPath;
            coc_nvim_1.window.showInformationMessage(`Running Headwind on: ${workspacePath}`);
            const rustyWindArgs = [workspacePath, '--write', shouldRemoveDuplicates ? '' : '--allow-duplicates'].filter((arg) => arg !== '');
            const rustyWindProc = child_process_1.spawn(rustywind_1.rustyWindPath, rustyWindArgs);
            rustyWindProc.stdout.on('data', (data) => data && data.toString() !== '' && console.log('rustywind stdout:\n', data.toString()));
            rustyWindProc.stderr.on('data', (data) => {
                if (data && data.toString() !== '') {
                    console.log('rustywind stderr:\n', data.toString());
                    coc_nvim_1.window.showErrorMessage(`Headwind error: ${data.toString()}`);
                }
            });
        }
    });
    context.subscriptions.push(runOnProject);
    context.subscriptions.push(disposable);
    // if runOnSave is enabled organize tailwind classes before saving
    if (config.get('headwind.runOnSave')) {
        context.subscriptions.push(coc_nvim_1.workspace.onWillSaveTextDocument(() => {
            coc_nvim_1.commands.executeCommand('headwind.sortTailwindClasses');
        }));
    }
}
exports.activate = activate;


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("coc.nvim");;

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sortClassString = void 0;
/**
 * Sorts a string of CSS classes according to a predefined order.
 * @param classString The string to sort
 * @param sortOrder The default order to sort the array at
 *
 * @returns The sorted string
 */
const sortClassString = (classString, sortOrder, options) => {
    let classArray = classString.split(/\s+/g);
    if (options.shouldRemoveDuplicates) {
        classArray = removeDuplicates(classArray);
    }
    // prepend custom tailwind prefix to all tailwind sortOrder-classes
    const sortOrderClone = [...sortOrder];
    if (options.customTailwindPrefix.length > 0) {
        for (let i = 0; i < sortOrderClone.length; i++) {
            sortOrderClone[i] = options.customTailwindPrefix + sortOrderClone[i];
        }
    }
    classArray = sortClassArray(classArray, sortOrderClone, options.shouldPrependCustomClasses);
    return classArray.join(' ');
};
exports.sortClassString = sortClassString;
const sortClassArray = (classArray, sortOrder, shouldPrependCustomClasses) => [
    ...classArray.filter((el) => shouldPrependCustomClasses && sortOrder.indexOf(el) === -1),
    ...classArray
        .filter((el) => sortOrder.indexOf(el) !== -1) // take the classes that are in the sort order
        .sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b)),
    ...classArray.filter((el) => !shouldPrependCustomClasses && sortOrder.indexOf(el) === -1),
];
const removeDuplicates = (classArray) => [...new Set(classArray)];


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("child_process");;

/***/ }),
/* 4 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const path = __webpack_require__(5);

module.exports.rustyWindPath = path.join(
  __dirname,
  `../bin/rustywind${process.platform === "win32" ? ".exe" : ""}`
);


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("path");;

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })()

));
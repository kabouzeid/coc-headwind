import { commands, workspace, ExtensionContext, Range, Uri, window } from 'coc.nvim';
import { sortClassString } from './utils';
import { spawn } from 'child_process';
import { rustyWindPath } from 'rustywind';

const config = workspace.getConfiguration();
const configRegex: { [key: string]: string } = config.get('headwind.classRegex') || {};

const sortOrder = config.get('headwind.defaultSortOrder');

const customTailwindPrefixConfig = config.get('headwind.customTailwindPrefix');
const customTailwindPrefix = typeof customTailwindPrefixConfig === 'string' ? customTailwindPrefixConfig : '';

const shouldRemoveDuplicatesConfig = config.get('headwind.removeDuplicates');
const shouldRemoveDuplicates = typeof shouldRemoveDuplicatesConfig === 'boolean' ? shouldRemoveDuplicatesConfig : true;

const shouldPrependCustomClassesConfig = config.get('headwind.prependCustomClasses');
const shouldPrependCustomClasses =
  typeof shouldPrependCustomClassesConfig === 'boolean' ? shouldPrependCustomClassesConfig : false;

export function activate(context: ExtensionContext) {
  const disposable = commands.registerCommand('headwind.sortTailwindClasses', async () => {
    const document = await workspace.document;

    const editorText = document.textDocument.getText();
    const editorLangId = document.textDocument.languageId;

    const classWrapperRegex = new RegExp(configRegex[editorLangId] || configRegex['html'], 'gi');
    let classWrapper: RegExpExecArray | null;
    while ((classWrapper = classWrapperRegex.exec(editorText)) !== null) {
      const wrapperMatch = classWrapper[0];
      const valueMatchIndex = classWrapper.findIndex((match, idx) => idx !== 0 && match);
      const valueMatch = classWrapper[valueMatchIndex];

      const startPosition = classWrapper.index + wrapperMatch.lastIndexOf(valueMatch);
      const endPosition = startPosition + valueMatch.length;

      const range = Range.create(
        document.textDocument.positionAt(startPosition),
        document.textDocument.positionAt(endPosition)
      );

      const options = {
        shouldRemoveDuplicates,
        shouldPrependCustomClasses,
        customTailwindPrefix,
      };

      document.applyEdits([
        { range, newText: sortClassString(valueMatch, Array.isArray(sortOrder) ? sortOrder : [], options) },
      ]);
    }
  });

  const runOnProject = commands.registerCommand('headwind.sortTailwindClassesOnWorkspace', () => {
    const workspaceFolder = workspace.workspaceFolders || [];
    if (workspaceFolder[0]) {
      const workspacePath = Uri.parse(workspaceFolder[0].uri).fsPath;
      window.showInformationMessage(`Running Headwind on: ${workspacePath}`);

      const rustyWindArgs = [workspacePath, '--write', shouldRemoveDuplicates ? '' : '--allow-duplicates'].filter(
        (arg) => arg !== ''
      );

      const rustyWindProc = spawn(rustyWindPath, rustyWindArgs);

      rustyWindProc.stdout.on(
        'data',
        (data) => data && data.toString() !== '' && console.log('rustywind stdout:\n', data.toString())
      );

      rustyWindProc.stderr.on('data', (data) => {
        if (data && data.toString() !== '') {
          console.log('rustywind stderr:\n', data.toString());
          window.showErrorMessage(`Headwind error: ${data.toString()}`);
        }
      });
    }
  });

  context.subscriptions.push(runOnProject);
  context.subscriptions.push(disposable);

  // if runOnSave is enabled organize tailwind classes before saving
  if (config.get('headwind.runOnSave')) {
    context.subscriptions.push(
      workspace.onWillSaveTextDocument(() => {
        commands.executeCommand('headwind.sortTailwindClasses');
      })
    );
  }
}

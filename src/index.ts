import { commands, languages, workspace, ExtensionContext, Range, Uri, TextEdit, TextDocument, window } from 'coc.nvim';
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

const formatterPriority = config.get<number>('headwind.formatterPriority', 0);

export function activate(context: ExtensionContext) {
  function getSortTailwindClassesEdits(document: TextDocument): TextEdit[] {
    const edits: TextEdit[] = [];

    const editorText = document.getText();
    const editorLangId = document.languageId;

    const classWrapperRegex = new RegExp(configRegex[editorLangId] || configRegex['html'], 'gi');
    let classWrapper: RegExpExecArray | null;
    while ((classWrapper = classWrapperRegex.exec(editorText)) !== null) {
      const wrapperMatch = classWrapper[0];
      const valueMatchIndex = classWrapper.findIndex((match, idx) => idx !== 0 && match);
      const valueMatch = classWrapper[valueMatchIndex];

      const startPosition = classWrapper.index + wrapperMatch.lastIndexOf(valueMatch);
      const endPosition = startPosition + valueMatch.length;

      const range = Range.create(document.positionAt(startPosition), document.positionAt(endPosition));

      const options = {
        shouldRemoveDuplicates,
        shouldPrependCustomClasses,
        customTailwindPrefix,
      };

      const newText = sortClassString(valueMatch, Array.isArray(sortOrder) ? sortOrder : [], options);

      // don't include the edit when nothing changed, this is needed to play nice with other plugins that use `onWillSaveTextDocument`
      if (document.getText(range) != newText) {
        edits.push(TextEdit.replace(range, newText));
      }
    }

    window.showInformationMessage('Formatted by Headwind');
    return edits;
  }

  const disposable = commands.registerCommand('headwind.sortTailwindClasses', async () => {
    const document = await workspace.document;
    document.applyEdits(getSortTailwindClassesEdits(document.textDocument));
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

  languages.registerDocumentFormatProvider(
    [
      { language: 'html' },
      { language: 'javascript' },
      { language: 'typescript' },
      { language: 'javascriptreact' },
      { language: 'typescriptreact' },
      { language: 'vue' },
    ],
    {
      provideDocumentFormattingEdits(document: TextDocument): TextEdit[] {
        return getSortTailwindClassesEdits(document);
      },
    },
    formatterPriority
  );
}

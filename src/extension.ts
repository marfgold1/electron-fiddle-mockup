// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ElectronManagerItem, ElectronManagerTreeView } from './electron-manager/ElectronManagerTreeView';
import { Manager } from './electron-manager/ElectronManager';
import path from 'path';

let gistStatus: vscode.StatusBarItem;
let activeElectronStatus: vscode.StatusBarItem;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('activated!');
	new ElectronManagerTreeView(context);
	const manager = Manager.getInstance();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		cancellable: false,
		title: 'Setting up Electron Fiddle',
	}, async (progress) => {
		progress.report({ message: 'Downloading Electron' });
		await new Promise((resolve) => setTimeout(resolve, 3000));
	});
	
	gistStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	gistStatus.text = '$(gist) 0cba0';
	gistStatus.command = 'electron-fiddle.helloWorld';
	gistStatus.show();
	
	activeElectronStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	activeElectronStatus.text = '$(rocket) Electron 12.0.0';
	activeElectronStatus.command = 'electron-fiddle.setActiveElectron';
	activeElectronStatus.show();

	const importGist = (source: string) => {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: `Importing Fiddle from ${source}`,
		}, async (progress) => {
			try {
				const fiddle = await manager.factory.fromGist(source);
				if (fiddle) {
					// Open current vscode window or new window
					await vscode.commands.executeCommand(
						'vscode.openFolder', 
						vscode.Uri.file(path.dirname(fiddle.mainPath)),
					);
					// main.js

					await vscode.commands.executeCommand(
						'vscode.setEditorLayout',
						{ orientation: 0, groups: [{ groups: [{}, {}], size: 0.5 }, { groups: [{}, {size:0.25}, {size:0.25}], size: 0.5 }] }
					);


				}
			} catch(err) {
				progress.report({ increment: 100 });
				vscode.window.showErrorMessage(`Could not import fiddle: ${err}`);
				return;
			}
		});
	};

	context.subscriptions.push(...[
		vscode.commands.registerCommand('electron-fiddle.setLayout', async () => {
			const files = {
				main: 'main.js',
				renderer: 'renderer.js',
				html: 'index.html',
				preload: 'preload.js',
				styles: 'styles.css',
			};
			
			await vscode.commands.executeCommand(
				'vscode.setEditorLayout',
				{ orientation: 0, groups: [{ groups: [{}, {}], size: 0.5 }, { groups: [{}, {}], size: 0.5 }] }
			);
		}),
		vscode.commands.registerCommand('electron-fiddle.importFromGist', (gist) => {
			if (!gist) {
				vscode.window.showInputBox({
					title: 'Import Fiddle from Gist',
					prompt: 'Please enter the Git URL, Gist ID or Gist URL',
					placeHolder: 'https://gist.github.com/username/1234abcd',
				}).then((value) => {
					if (value) {
						importGist(value);
					}
				});
				return;
			}
			importGist(gist);
		}),
		vscode.commands.registerCommand('electron-fiddle.publish', async () => {
			let name = await vscode.window.showInputBox({
				title: 'Publish Fiddle',
				prompt: 'Please enter the name of the Gist',
				placeHolder: 'Electron Fiddle Gist',
				value: 'Electron Fiddle Gist',
			});
			if (!name) {
				return;
			}
			const isPublic = await vscode.window.showQuickPick([
				{ label: '$(lock) Private', description: 'Only you and collaborators can see this gist', public: false },
				{ label: '$(unlock) Public', description: 'Anyone can see this gist', public: true },
			], {
				title: 'Publish Fiddle',
				placeHolder: 'Please select the visibility of the Gist',
			});
			if (!isPublic) {
				return;
			}
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				cancellable: true,
				title: `Publishing fiddle to gist`,
			}, async (progress) => {
				try {
					await new Promise((resolve) => setTimeout(resolve, 3000));
					progress.report({ increment: 100 });
					const id = '0a982beaac8209jeead';
					(async () => {
						const isCopy = await vscode.window.showInformationMessage(`Fiddle published to ${id}`, {
							title: 'Copy URL',
							copy: true,
						});
						gistStatus.text = '$(gist) ' + id.substring(0, 6);
						gistStatus.show();
						if (isCopy?.copy) {
							await vscode.env.clipboard.writeText(`https://gist.github.com/${id}`);
						}
					})();
				} catch (err) {
					vscode.window.showErrorMessage(`Could not publish fiddle: ${err}`);
				}
			});
		}),
		vscode.commands.registerCommand('electron-fiddle.updateFiddle', async () => {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				title: `Updating fiddle`,
			}, async (progress) => {
				try {
					await new Promise((resolve) => setTimeout(resolve, 3000));
					progress.report({ increment: 100 });
					const id = '0a982beaac8209jeead';
					(async () => {
						const isCopy = await vscode.window.showInformationMessage(`Fiddle updated`, {
							title: 'Copy URL',
							copy: true,
						});
						gistStatus.show();
						if (isCopy?.copy) {
							await vscode.env.clipboard.writeText(`https://gist.github.com/${id}`);
						}
					})();
				} catch (err) {
					vscode.window.showErrorMessage(`Could not update fiddle: ${err}`);
				}
			});
		}),
		vscode.commands.registerCommand('electron-fiddle.deleteFiddle', async () => {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				title: `Deleting fiddle`,
			}, async (progress) => {
				try {
					await new Promise((resolve) => setTimeout(resolve, 3000));
					progress.report({ increment: 100 });
					vscode.window.showInformationMessage(`Fiddle deleted`);
					gistStatus.hide();
				} catch (err) {
					vscode.window.showErrorMessage(`Could not delete fiddle: ${err}`);
				}
			});
		}),
		vscode.commands.registerCommand('electron-fiddle.setActiveElectron', async (ver?: string) => {
			if (!ver) {
				const versions = await manager.getFilteredVersions();
				const res = await vscode.window.showQuickPick(Object.values(versions).map((v) => ({
					label: `$(${v.downloaded ? 'package' : 'cloud-download'}) ${v.semver.toString()}`,
					description: v.state.toString(),
					version: v.semver.toString(),
				})), {
					placeHolder: 'Select Active Electron Version',
					title: 'Active Electron Version',
				});
				if (!res) {
					return;
				}
				ver = res.version;
			}
		}),
		vscode.commands.registerCommand('electron-fiddle.bisectFiddle', async (earliest?: string, latest?: string) => {
			if (!earliest || !latest) {
				const versions = await manager.getFilteredVersions();
				const res = await vscode.window.showQuickPick(Object.values(versions).map((v) => ({
					label: `$(${v.downloaded ? 'package' : 'cloud-download'}) ${v.semver.toString()}`,
					description: v.state.toString(),
					version: v.semver.toString(),
				})), {
					placeHolder: 'Select Earliest Electron Version',
					title: 'Start a bisect session',
				});
				if (!res) {
					return;
				}
				earliest = res.version;
				const res2 = await vscode.window.showQuickPick(Object.values(versions).map((v) => ({
					label: `$(${v.downloaded ? 'package' : 'cloud-download'}) ${v.semver.toString()}`,
					description: v.state.toString(),
					version: v.semver.toString(),
				})), {
					placeHolder: 'Select Latest Electron Version',
					title: `Start a bisect session (from ${earliest})`,
				});
				if (!res2) {
					return;
				}
				latest = res2.version;
				// Confirm yes/no
				const confirm = await vscode.window.showQuickPick([
					{ label: '$(check) Yes', description: 'Start bisecting', confirm: true },
					{ label: '$(x) No', description: 'Cancel bisecting', confirm: false },
				], {
					placeHolder: `Start bisecting between ${earliest} and ${latest}?`,
					title: 'Start a bisect session',
				});
			}
		}),
		vscode.commands.registerCommand('electron-fiddle.installElectron', async (node) => {
			if (node instanceof ElectronManagerItem){
				await manager.installer.ensureDownloaded(node.version);

			}
		}),
		vscode.commands.registerCommand('electron-fiddle.uninstallElectron', async (node) => {
			console.log(node);
		}),
	]);
	let hw = vscode.commands.registerCommand('electron-fiddle.helloWorld', () => {
		// Display a message box to the user
		vscode.window.showQuickPick([
			{
				label: '$(cloud-upload) Publish',
				description: 'Publish the current fiddle to Gist',
				command: 'electron-fiddle.publish',
			},
			{
				label: '$(sync) Update',
				description: 'Update the current fiddle to Gist',
				command: 'electron-fiddle.updateFiddle',
			},
			{
				label: '$(trash) Delete',
				description: 'Delete the current fiddle from Gist',
				command: 'electron-fiddle.deleteFiddle',
			}
		], {
			placeHolder: 'What would you like to do with your fiddle?',
			title: 'Manage Fiddle',
		});
	});
	context.subscriptions.push(hw);
}

// This method is called when your extension is deactivated
export function deactivate() {}

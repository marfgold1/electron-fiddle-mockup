import type { SemVer } from '@electron/fiddle-core';
import * as vscode from 'vscode';
import { ElectronVersionChannel, ElectronVersionState, Manager } from './ElectronManager';

export class ElectronManagerTreeView {
    private treeView: vscode.TreeView<ElectronManagerItem>;
    readonly provider: ElectronManagerTreeDataProvider;

    constructor(context: vscode.ExtensionContext) {
        this.provider = new ElectronManagerTreeDataProvider();
        const manager = Manager.getInstance();
        manager.installer.on('state-changed', () => 
            this.provider.refresh()
        );

        this.treeView = vscode.window.createTreeView(
            'electron-manager',
            {
                treeDataProvider: this.provider,
            }
        );
        
        const setChannelFilter = (channel: string, toggle: boolean) => {
            context.workspaceState.update(`electron-fiddle:is${channel}ElectronVersion`, toggle);
            this.provider.refresh();
            manager.toggleChannel(channel as ElectronVersionChannel, toggle);
            vscode.commands.executeCommand('setContext', `electron-fiddle:is${channel}ElectronVersion`, toggle);
        };
        const channel = ['NotDownloaded', 'Stable', 'Beta', 'Nightly', 'Obsolete'];
        const toggle = ['show', 'hide'];
        context.subscriptions.push(...channel.flatMap(c => toggle.map(t =>
            vscode.commands.registerCommand(
                `electron-fiddle.${t}${c}ElectronVersion`,
                () => setChannelFilter(c, !(t === 'show'))
            )
        )));
        channel.forEach(c => setChannelFilter(c, context.workspaceState.get(`electron-fiddle:is${c}ElectronVersion`, true)));

        context.subscriptions.push(this.treeView);
    }

    refresh() {
        this.provider.refresh();
    }
}

class ElectronManagerTreeDataProvider implements vscode.TreeDataProvider<ElectronManagerItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;
  
    refresh(): void {
      this._onDidChangeTreeData.fire();
    }
    getTreeItem(element: ElectronManagerItem): vscode.TreeItem {
        return element;
    }
    getChildren(element?: ElectronManagerItem): Thenable<ElectronManagerItem[]> {
        const manager = Manager.getInstance();
        return manager.getFilteredVersions().then(ver => {
            return Promise.resolve(Object.values(ver)
                .map(v => new ElectronManagerItem(
                    v.semver.toString(),
                    v.downloaded,
                ))
            );
        }).catch(() => {
            return Promise.reject('Could not load versions');
        });
    }
}

export class ElectronManagerItem extends vscode.TreeItem {
    constructor(
        public readonly version: string,
        public readonly downloaded: boolean = false,
        public readonly active: boolean = false,
    ) {
        super(version);
        this.description = active ? 'active' : '';
        this.contextValue = active ? 'electron-installed-active' : downloaded ? 'electron-installed' : 'electron';
        this.iconPath = new vscode.ThemeIcon(
            downloaded ? 'package' : 'cloud-download',
            new vscode.ThemeColor(downloaded ? 'electronfiddle.electronInstalled' : 'electronfiddle.electronNotInstalled'),
        );
    }
}
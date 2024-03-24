import type { SemVer } from '@electron/fiddle-core';
import { InstallState } from '@electron/fiddle-core';
import * as vscode from 'vscode';
import { ElectronVersionState, Manager } from './ElectronManager';

export enum ElectronVersionChannel {
    Installed = 'installed',
    Stable = 'Stable',
    Beta = 'Beta',
    Nightly = 'Nightly',
    Obsolete = 'Obsolete',
}

const channelFilter: {[channel: string]: (data: ElectronVersionState) => boolean} = {
    [ElectronVersionChannel.Installed]: ({ installed }) => installed,
    [ElectronVersionChannel.Stable]: ({ semver: x }) => x.prerelease.length === 0 && x.compare('27.0.0') >= 0,
    [ElectronVersionChannel.Beta]: ({ semver: x }) => x.prerelease.includes('beta') && x.compare('27.0.0') >= 0,
    [ElectronVersionChannel.Nightly]: ({ semver: x }) => x.prerelease.includes('nightly') && x.compare('27.0.0') >= 0,
    [ElectronVersionChannel.Obsolete]: ({ semver: x }) => x.compare('27.0.0') === -1,
};

export class ElectronManagerTreeView {
    private readonly treeView: {[channel: string]: vscode.TreeView<ElectronManagerItem>} = {};
    constructor(context: vscode.ExtensionContext) {
        for (const channel of Object.values(ElectronVersionChannel)) {
            this.treeView[channel] = vscode.window.createTreeView(
                `electron-version-${channel.toLowerCase()}`,
                {
                    treeDataProvider: new ElectronManagerTreeDataProvider(channel),
                }
            );
            context.subscriptions.push(this.treeView[channel]);
        }
    }
}

class ElectronManagerTreeDataProvider implements vscode.TreeDataProvider<ElectronManagerItem> {
    private channel: ElectronVersionChannel;

    private _onDidChangeTreeData = new vscode.EventEmitter<ElectronManagerItem | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(channel: ElectronVersionChannel = ElectronVersionChannel.Stable) {
        this.channel = channel;
        const installer = Manager.getInstance().installer;
        installer.on('state-change', (version: string, _: InstallState) => {
            this._onDidChangeTreeData.fire();
        });
    }

    getTreeItem(element: ElectronManagerItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ElectronManagerItem): Thenable<ElectronManagerItem[]> {
        const manager = Manager.getInstance();
        return manager.loadVersions().then(ver => {
            return Promise.resolve(Object.values(ver)
                .filter(channelFilter[this.channel])
                .map(v => new ElectronManagerItem(
                    v.semver.toString(),
                    v.installed,
                ))
            );
        }).catch(() => {
            return Promise.reject('Could not load versions');
        });
    }
}

class ElectronManagerItem extends vscode.TreeItem {
    constructor(
        public readonly version: string,
        public readonly downloaded: boolean = false,
    ) {
        super(version);
        this.contextValue = downloaded ? 'electron-installed' : 'electron';
        this.iconPath = new vscode.ThemeIcon(
            downloaded ? 'package' : 'cloud-download',
            new vscode.ThemeColor(downloaded ? 'electronfiddle.electronInstalled' : 'electronfiddle.electronNotInstalled'),
        );
    }
}
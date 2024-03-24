import { InstallState, SemVer } from '@electron/fiddle-core';
import { Installer, ElectronVersions, FiddleFactory } from '@electron/fiddle-core';

export type ElectronVersionState = {semver: SemVer, state: InstallState, installed: boolean};

const isInstalled = (state: InstallState) =>
    state === InstallState.downloaded ||
    state === InstallState.installing ||
    state === InstallState.installed;

export class Manager {
    private static instance: Manager;
    public static getInstance() {
        if (!Manager.instance) {
            Manager.instance = new Manager();
        }
        return Manager.instance;
    }

    readonly installer: Installer;
    readonly factory: FiddleFactory;
    private versions?: ElectronVersions;
    private versionCache: {[version: string]: ElectronVersionState} = {};
    constructor() {
        this.installer = new Installer();
        this.factory = new FiddleFactory();
    }

    async loadVersions() {
        if (!this.versions) {
            this.versions = await ElectronVersions.create();
            const d = this.versions.versions.sort((a, b) => b.compare(a)).map(v => {
                const st = this.installer.state(v.toString());
                return {
                    semver: v,
                    state: st,
                    installed: isInstalled(st)
                };
            });
            for (const v of d) {
                this.versionCache[v.semver.toString()] = v;
            }
            this.installer.on('state-change', (version: string, state: InstallState) => {
                this.versionCache[version].state = state;
                this.versionCache[version].installed = isInstalled(state);
            });
        }
        return this.versionCache;
    }
}
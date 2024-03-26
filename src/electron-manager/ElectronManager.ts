import { InstallState, SemVer } from '@electron/fiddle-core';
import { Installer, ElectronVersions, FiddleFactory } from '@electron/fiddle-core';

export type ElectronVersionState = {semver: SemVer, state: InstallState, downloaded: boolean};

const isDownloaded = (state: InstallState) =>
    state === InstallState.downloaded ||
    state === InstallState.installing ||
    state === InstallState.installed;

export enum ElectronVersionChannel {
    NotDownloaded = 'NotDownloaded',
    Stable = 'Stable',
    Beta = 'Beta',
    Nightly = 'Nightly',
    Obsolete = 'Obsolete',
}

type FilterFunction = (has: boolean, data: ElectronVersionState) => boolean | undefined;
type FilterMap = { [K in ElectronVersionChannel]: FilterFunction };

const filter: FilterMap = {
    [ElectronVersionChannel.NotDownloaded]: (has, { downloaded }) => has || downloaded,
    [ElectronVersionChannel.Stable]: (has, { semver: x }) => has && (x.prerelease.length === 0),
    [ElectronVersionChannel.Beta]: (has, { semver: x }) => has && (x.prerelease.includes('beta') || x.prerelease.includes('alpha')),
    [ElectronVersionChannel.Nightly]: (has, { semver: x }) => has && x.prerelease.includes('nightly'),
    [ElectronVersionChannel.Obsolete]: (has, { semver: x }) => has || x.compare('27.0.0') !== -1,
};

const channelCheck = [
    ElectronVersionChannel.NotDownloaded, ElectronVersionChannel.Obsolete,
    [ElectronVersionChannel.Stable, ElectronVersionChannel.Beta, ElectronVersionChannel.Nightly]
];

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
    readonly channels: Set<ElectronVersionChannel> = new Set();
    constructor() {
        this.installer = new Installer();
        this.factory = new FiddleFactory();
        
        this.installer.on('state-changed', ({ version, state }: {version: string, state: InstallState}) => {
            this.versionCache[version].state = state;
            this.versionCache[version].downloaded = isDownloaded(state);
        });
    }

    toggleChannel(channel: ElectronVersionChannel, toggle: boolean) {
        if (toggle) {
            this.channels.add(channel);
        } else {
            this.channels.delete(channel);
        }
    }

    async getFilteredVersions() {
        const versions = await this.loadVersions();
        const has = Object.fromEntries(Object.keys(filter).map(k => [
            k, this.channels.has(k as ElectronVersionChannel)
        ]));
        const f = (x: ElectronVersionState) => {
            return channelCheck.every((c) => c instanceof Array ?
                c.some((cc) => filter[cc](has[cc], x)) :
                filter[c](has[c], x));
        };
        return Object.fromEntries(Object.entries(versions).filter(([_, v]) => f(v)));
    }

    async loadVersions() {
        if (!this.versions) {
            this.versions = await ElectronVersions.create();
            const d = this.versions.versions.sort((a, b) => b.compare(a)).map(v => {
                const st = this.installer.state(v.toString());
                return {
                    semver: v,
                    state: st,
                    downloaded: isDownloaded(st)
                };
            });
            for (const v of d) {
                this.versionCache[v.semver.toString()] = v;
            }
        }
        return this.versionCache;
    }
}
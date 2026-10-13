// noinspection JSUnusedGlobalSymbols,JSIgnoredPromiseFromCall

import {App, Plugin, PluginManifest, PluginSettingTab, Setting} from 'obsidian';

interface PluginTab {
    id: string;
    name: string;
    navEl?: HTMLElement;
}

interface InternalApp extends App {
    plugins: {
        manifests: Record<string, PluginManifest>;
        loadManifests: () => Promise<void>;
    };
    setting?: {
        pluginTabs: PluginTab[];
    };
}

interface RenamerSettings {
    customNames: Record<string, string>;
}

const DEFAULT_SETTINGS: RenamerSettings = {
    customNames: {}
};

export default class PluginRenamer extends Plugin {
    settings!: RenamerSettings;
    private originalLoadManifests!: () => Promise<void>;

    async onload(): Promise<void> {
        await this.loadSettings();

        const internalApp = this.app as InternalApp;

        this.applyToMemoryAndSidebar();

        this.originalLoadManifests = internalApp.plugins.loadManifests.bind(internalApp.plugins);

        internalApp.plugins.loadManifests = async () => {
            await this.originalLoadManifests();
            this.applyToMemoryAndSidebar();
        };

        this.addSettingTab(new RenamerSettingTab(this.app, this));
    }

    onunload(): void {
        const internalApp = this.app as InternalApp;

        if (this.originalLoadManifests) {
            internalApp.plugins.loadManifests = this.originalLoadManifests;
        }
    }

    applyToMemoryAndSidebar(): void {
        const internalApp = this.app as InternalApp;
        const manifests = internalApp.plugins.manifests;

        for (const id in this.settings.customNames) {
            const customName = this.settings.customNames[id];
            const manifest = manifests[id];

            if (customName !== undefined && manifest !== undefined) {
                manifest.name = customName;
            }
        }

        if (internalApp.setting && internalApp.setting.pluginTabs) {
            const tabs = internalApp.setting.pluginTabs;

            tabs.forEach((tab) => {
                const customName = this.settings.customNames[tab.id];

                if (customName !== undefined) {
                    Object.defineProperty(tab, 'name', {
                        get: () => customName,
                        configurable: true
                    });

                    if (tab.navEl && tab.navEl.innerText !== customName) {
                        tab.navEl.innerText = customName;
                    }
                }
            });

            tabs.sort((a, b) => a.name.localeCompare(b.name));

            const navContainer = tabs[0]?.navEl?.parentElement;
            if (navContainer) {
                tabs.forEach((tab) => {
                    if (tab.navEl) {
                        navContainer.appendChild(tab.navEl);
                    }
                });
            }
        }
    }

    async loadSettings(): Promise<void> {
        const loadedData = (await this.loadData()) as Partial<RenamerSettings> | null;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        this.applyToMemoryAndSidebar();
    }
}

const BaseSettingTab = PluginSettingTab;

class RenamerSettingTab extends BaseSettingTab {
    plugin: PluginRenamer;

    constructor(app: App, plugin: PluginRenamer) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        void new Setting(containerEl)
            .setHeading()
            .setName('Plugin renamer & grouper');

        void new Setting(containerEl)
            .setDesc('Assign custom names to your plugins. Use prefixes (e.g., [UI], [sync]) to automatically group them. Watch the left sidebar update and re-sort instantly!');

        const internalApp = this.app as InternalApp;
        const manifests = internalApp.plugins.manifests;

        const allPlugins = Object.values(manifests).filter(manifest => manifest.id !== this.plugin.manifest.id);

        const renamedPlugins: PluginManifest[] = [];
        const originalPlugins: PluginManifest[] = [];

        allPlugins.forEach((manifest: PluginManifest) => {
            if (this.plugin.settings.customNames[manifest.id] !== undefined) {
                renamedPlugins.push(manifest);
            } else {
                originalPlugins.push(manifest);
            }
        });

        renamedPlugins.sort((a: PluginManifest, b: PluginManifest) => {
            const nameA = (this.plugin.settings.customNames[a.id] ?? a.name).toLowerCase();
            const nameB = (this.plugin.settings.customNames[b.id] ?? b.name).toLowerCase();
            return nameA.localeCompare(nameB);
        });

        originalPlugins.sort((a: PluginManifest, b: PluginManifest) => {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });

        const renderPluginRow = (manifest: PluginManifest) => {
            void new Setting(containerEl)
                .setName(manifest.id)
                .setDesc(`Current name: ${manifest.name}`)
                .addText(text => {
                    void text.setPlaceholder('Enter custom name...')
                        .setValue(this.plugin.settings.customNames[manifest.id] ?? '')
                        .onChange((value) => {
                            void (async () => {
                                const trimmedValue = value.trim();
                                if (trimmedValue === '') {
                                    delete this.plugin.settings.customNames[manifest.id];
                                } else {
                                    this.plugin.settings.customNames[manifest.id] = trimmedValue;
                                }
                                await this.plugin.saveSettings();
                            })();
                        });
                    return text;
                });
        };

        if (renamedPlugins.length > 0) {
            void new Setting(containerEl)
                .setHeading()
                .setName('Renamed plugins');

            renamedPlugins.forEach(renderPluginRow);
        }

        if (originalPlugins.length > 0) {
            void new Setting(containerEl)
                .setHeading()
                .setName('Original plugins');

            originalPlugins.forEach(renderPluginRow);
        }
    }
}

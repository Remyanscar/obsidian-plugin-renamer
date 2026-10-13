# Plugin Renamer for Obsidian

A straightforward utility plugin that allows you to assign custom names to your installed community plugins. By renaming them or adding prefixes (like `[UI]` or `[sync]`), you can automatically group them and re-sort your settings sidebar for better organization.

## 1. Why use this?

If you use dozens of community plugins, the Obsidian settings sidebar can quickly become cluttered. Plugins are sorted alphabetically by their developer-assigned names, which might not match how you think about them. 

This plugin lets you rename them to whatever makes sense to you, instantly re-sorting the sidebar based on your new names.

## 2. Features

- **Custom Names:** Assign custom names to any installed plugin. Use prefixes to group related plugins together.
- **Live Updates:** Watch the left settings sidebar update and physically re-sort instantly as you type your new names.
- **Safe Cleanup:** The plugin modifies names in Obsidian's memory and the UI DOM. When unloaded, it safely restores the original internal functions (`loadManifests`) to prevent memory leaks or unexpected behavior.
- **Self-Preservation:** The plugin intentionally excludes itself from the renaming list so you don't accidentally lose it in the sidebar.

## 3. Important Notes

- **Internal API:** This plugin relies on Obsidian's internal, undocumented API to intercept plugin loading and manipulate the settings sidebar DOM elements. 
- **Non-Destructive:** All custom names are saved in the plugin's own settings. Your actual plugin files and original downloaded manifests remain untouched on your hard drive.

## 4. Installation

### Manual Installation

Copy over `main.js` and `manifest.json` to your vault `VaultFolder/.obsidian/plugins/obsidian-plugin-renamer/`.

Inkspire — Custom Rich Text Editor for Strapi

Inkspire is a lightweight, extensible rich text editor plugin for Strapi.
It provides a clean WYSIWYG experience with JSON-based output, built to integrate seamlessly into Strapi’s Content-Type Builder.

✨ Features

Custom Field Integration: Add Inkspire as a field type in your Strapi collection types.

Core Formatting: Bold, italic, headers, lists.

Preview Mode: Live preview synced with editor content.

State Management: Centralized React state for stable content flow (editor → preview → database → reload).

Scoped Styling: Styles isolated from Strapi’s admin theme.

Persistence: Content stored as structured JSON, ensuring clean API output.

🚀 Installation
# Inside your Strapi project
npm install inkspire-plugin
# or
yarn add inkspire-plugin


Then enable the plugin in ./config/plugins.js:

module.exports = {
  'inkspire-plugin': {
    enabled: true,
  },
};

⚡ Usage

In Content-Type Builder, add a new field and select Inkspire Editor.

Use the editor to write and format content.

Preview updates instantly.

Save → Reload → Watch content persist cleanly.

🛠 Development
Local Development

Clone the repo inside your Strapi project’s ./plugins folder:

cd my-strapi-project/plugins
git clone https://github.com/kaushikpatil1710/Inkspire/tree/development


Run Strapi with:

npm run develop

Plugin build:

cd your-path/src/plugins/inkspire-plugin: 

npm run build


The plugin will auto-register.

📦 Data Format

Inkspire stores content as structured JSON:

{
  "blocks": [
    { "type": "paragraph", "data": { "text": "Hello world!" } },
    { "type": "header", "data": { "level": 2, "text": "Section Title" } },
    { "type": "list", "data": { "style": "unordered", "items": ["One", "Two", "Three"] } }
  ]
}


This makes it frontend-friendly for frameworks like Next.js, React, or Vue.

🐞 Known Issues (Current Version)

Toolbar active-state indicators missing (bold/italic button doesn’t highlight).

Undo/Redo not implemented.

Minor spacing inconsistencies in preview (headers/lists).

📌 Roadmap

✅ Core formatting + preview

✅ State-driven architecture

⬜ Undo/Redo support

⬜ Active toolbar states

⬜ AI-assisted content suggestions

⬜ Media embedding (images, videos)

🤝 Contributing

Pull requests and feature suggestions are welcome. Please open an issue first to discuss what you’d like to add or fix.

📜 License

MIT License. Free to use, modify, and distribute.

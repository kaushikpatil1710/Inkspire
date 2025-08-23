import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import Logo from './components/Logo';

export default {
  register(app: any) {
    app.customFields.register({
      name: "inkspire-editor",
      pluginId: PLUGIN_ID,
      type: "string", // DB type that matches server registration
      icon: Logo,
      intlLabel: {
        id: "inkspire.editor.label",
        defaultMessage: "Inkspire Editor",
      },
      intlDescription: {
        id: "inkspire.editor.description",
        defaultMessage: "A sleek, intelligent rich-text editor plugin for Strapi.",
      },
      components: {
        Input: async () =>
          import('./components/BrandPreview').then((module) => ({
            default: module.default,
          })),
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};

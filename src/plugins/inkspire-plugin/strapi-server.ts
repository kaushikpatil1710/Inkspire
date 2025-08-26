// plugins/inkspire-plugin/strapi-server.ts

export default {
  /**
   * Called right before the application starts
   */
  register({ strapi }: { strapi: any }) {
    // Register the custom field with Strapi
    strapi.customFields.register({
      name: 'inkspire-editor',     // must match admin registration
      plugin: 'inkspire-plugin',   // must match your PLUGIN_ID
      type: 'richtext',              // underlying data type in DB
      inputSize: {
        default: 12,
        isResizable: true,
      },
    });
  },

  /**
   * Called when the app starts
   */
  bootstrap({ strapi }: { strapi: any }) {
    // Future: add AI service bootstrapping, logging, etc.
  },
};

import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: [
      'ar', 'fr', 'cs', 'de', 'dk', 'es', 'en', 'he', 'id', 'it',
      'ja', 'ko', 'ms', 'nl', 'no', 'pl', 'pt-BR', 'pt', 'ru',
      'sk', 'sv', 'th', 'tr', 'uk', 'vi', 'zh-Hans', 'zh',
    ],
    translations: {
      en: {
        'inkspire-plugin.plugin.name': 'Inkspire Plugin',
      },
      fr: {
        'inkspire-plugin.plugin.name': 'Plugin Inkspire',
      },
    },
  },
  bootstrap(app: StrapiApp) {
    console.log(app);
  },
};

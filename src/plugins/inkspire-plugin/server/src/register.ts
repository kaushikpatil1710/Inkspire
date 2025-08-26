import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // register phase
  strapi.customFields.register({
    name: 'inkspire-editor',
    plugin: 'inkspire-plugin',
    type: 'string',  // the underlying data type
    inputSize: { default: 12, isResizable: true }, // optional
  });
};


export default register;

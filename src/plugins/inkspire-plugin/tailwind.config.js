// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',        // if you have a frontend in ./src
    './admin/src/**/*.{js,jsx,ts,tsx}',  // Strapi admin panel
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

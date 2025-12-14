/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",        // Scannt index.html
    "./lib/**/*.js"     // Scannt deine JS-Dateien (Wichtig für Autocomplete!)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1f2937",
          accent: "#f97316",
          muted: "#9ca3af",
        },
        surface: {
          base: "#0f172a",
          elevated: "#111827",
        },
      },
      fontFamily: {
        display: ["SF Pro Display", ...defaultTheme.fontFamily.sans],
        sans: ["SF Pro Text", ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        pos: "0 20px 50px -20px rgba(15, 23, 42, 0.6)",
      },
    },
  },
  plugins: [],
};


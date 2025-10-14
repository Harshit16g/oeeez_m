import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Oeeez Brand Colors
        oeeez: {
          red: {
            50: "#fef2f2",
            100: "#fee2e2",
            200: "#fecaca",
            300: "#fca5a5",
            400: "#f87171",
            500: "#ef4444",
            600: "#dc2626",
            700: "#c0392b", // Primary brand red
            800: "#991b1b",
            900: "#7f1d1d",
          },
          teal: {
            50: "#f0fdfa",
            100: "#ccfbf1",
            200: "#99f6e4",
            300: "#5eead4",
            400: "#2dd4bf",
            500: "#14b8a6",
            600: "#16a085", // Primary brand teal
            700: "#0f766e",
            800: "#115e59",
            900: "#134e4a",
          },
          coral: {
            DEFAULT: "#e17055",
            light: "#fab1a0",
          },
          navy: {
            DEFAULT: "#2c3e50",
            dark: "#1a252f",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "gradient-shift": {
          "0%, 100%": {
            "background-position": "0% 50%",
          },
          "50%": {
            "background-position": "100% 50%",
          },
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-20px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-shift": "gradient-shift 15s ease infinite",
        "float": "float 6s ease-in-out infinite",
      },
      perspective: {
        "1000": "1000px",
        "2000": "2000px",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    ({ addUtilities }: any) => {
      const newUtilities = {
        ".perspective-1000": {
          perspective: "1000px",
        },
        ".perspective-2000": {
          perspective: "2000px",
        },
        ".transform-style-3d": {
          "transform-style": "preserve-3d",
        },
        ".backface-hidden": {
          "backface-visibility": "hidden",
        },
        ".bg-isometric-cubes": {
          backgroundImage: `
            linear-gradient(30deg, #c0392b 12%, transparent 12.5%, transparent 87%, #c0392b 87.5%, #c0392b),
            linear-gradient(150deg, #c0392b 12%, transparent 12.5%, transparent 87%, #c0392b 87.5%, #c0392b),
            linear-gradient(30deg, #c0392b 12%, transparent 12.5%, transparent 87%, #c0392b 87.5%, #c0392b),
            linear-gradient(150deg, #c0392b 12%, transparent 12.5%, transparent 87%, #c0392b 87.5%, #c0392b),
            linear-gradient(60deg, #e17055 25%, transparent 25.5%, transparent 75%, #e17055 75%, #e17055),
            linear-gradient(60deg, #e17055 25%, transparent 25.5%, transparent 75%, #e17055 75%, #e17055)
          `,
          backgroundColor: "#16a085",
          backgroundSize: "80px 140px",
          backgroundPosition: "0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px",
        },
        ".bg-gradient-oeeez": {
          backgroundImage: "linear-gradient(135deg, #c0392b 0%, #e17055 50%, #16a085 100%)",
          backgroundSize: "200% 200%",
        },
        ".text-gradient-oeeez": {
          backgroundImage: "linear-gradient(135deg, #c0392b 0%, #e17055 50%, #16a085 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
      }
      addUtilities(newUtilities)
    },
  ],
} satisfies Config

export default config

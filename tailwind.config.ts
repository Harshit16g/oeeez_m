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
        // Oeeez Luxury Mechanical Theme Colors
        oeeez: {
          black: {
            DEFAULT: "#0a0a0a", // Deep black background
            light: "#1a1a1a",
            lighter: "#2a2a2a",
          },
          crimson: {
            DEFAULT: "#dc143c", // Bold crimson red
            light: "#ff1744",
            dark: "#a80000",
          },
          steel: {
            50: "#f8f9fa",
            100: "#e9ecef",
            200: "#dee2e6",
            300: "#ced4da",
            400: "#adb5bd",
            500: "#6c757d", // Light gray text
            600: "#495057",
            700: "#343a40",
            800: "#212529",
            900: "#0a0a0a",
          },
          glossy: {
            light: "rgba(255, 255, 255, 0.1)",
            medium: "rgba(255, 255, 255, 0.05)",
            dark: "rgba(0, 0, 0, 0.3)",
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
        "shine": {
          "0%": {
            "background-position": "-200% center",
          },
          "100%": {
            "background-position": "200% center",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            "box-shadow": "0 0 20px rgba(220, 20, 60, 0.5)",
          },
          "50%": {
            "box-shadow": "0 0 40px rgba(220, 20, 60, 0.8)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-shift": "gradient-shift 15s ease infinite",
        "float": "float 6s ease-in-out infinite",
        "shine": "shine 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
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
        ".bg-mechanical-grid": {
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundColor: "#0a0a0a",
          backgroundSize: "50px 50px",
        },
        ".bg-glossy-card": {
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        ".bg-gradient-crimson": {
          backgroundImage: "linear-gradient(135deg, #dc143c 0%, #a80000 100%)",
        },
        ".bg-gradient-steel": {
          backgroundImage: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)",
        },
        ".text-gradient-crimson": {
          backgroundImage: "linear-gradient(135deg, #dc143c 0%, #ff1744 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".glossy-shadow": {
          boxShadow: "0 8px 32px 0 rgba(220, 20, 60, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
        },
        ".glossy-shadow-lg": {
          boxShadow: "0 12px 48px 0 rgba(220, 20, 60, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)",
        },
      }
      addUtilities(newUtilities)
    },
  ],
} satisfies Config

export default config

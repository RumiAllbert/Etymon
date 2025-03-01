import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			serif: [
  				'var(--font-noto-serif)',
  				'ui-serif'
  			]
  		},
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(-20px)" },
          "50%": { transform: "translateY(-40px)" },
          "75%": { transform: "translateY(-60px)" }
        },
        "grow-path": {
          "0%": { strokeDasharray: "1, 200", strokeDashoffset: "0" },
          "50%": { strokeDasharray: "100, 200", strokeDashoffset: "-15" },
          "100%": { strokeDasharray: "100, 200", strokeDashoffset: "-125" }
        },
        "grow-branch": {
          "0%": { opacity: "0", strokeDasharray: "1, 100", strokeDashoffset: "0" },
          "50%": { opacity: "0.5", strokeDasharray: "50, 100", strokeDashoffset: "-25" },
          "100%": { opacity: "1", strokeDasharray: "100, 100", strokeDashoffset: "-50" }
        },
        "write": {
          "0%": { strokeDasharray: "1, 100", strokeDashoffset: "0" },
          "50%": { strokeDasharray: "50, 100", strokeDashoffset: "-25" },
          "100%": { strokeDasharray: "100, 100", strokeDashoffset: "-100" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "bounce-slow": "bounce-slow 2s infinite ease-in-out",
        "grow-path": "grow-path 2s infinite ease-in-out",
        "grow-branch-1": "grow-branch 2s infinite ease-in-out 0.2s",
        "grow-branch-2": "grow-branch 2s infinite ease-in-out 0.4s",
        "grow-branch-3": "grow-branch 2s infinite ease-in-out 0.6s",
        "grow-branch-4": "grow-branch 2s infinite ease-in-out 0.8s",
        "write": "write 3s infinite ease-in-out"
      },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

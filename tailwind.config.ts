import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'sans-serif'],
    },
  	extend: {
  		colors: {
  			// 둥지마켓 브랜드 컬러 - 새로운 색상 시스템
  			dungji: {
  				// 메인 컬러: 그린
  				primary: {
  					DEFAULT: '#27AE60',
  					light: '#2ECC71',
  					lighter: '#52E584',
  					dark: '#229954',
  					darker: '#1E7E34',
  					50: '#E8F8F0',
  					100: '#D0F1DD',
  					200: '#A1E3BB',
  					300: '#72D599',
  					400: '#43C777',
  					500: '#27AE60',
  					600: '#229954',
  					700: '#1E7E34',
  					800: '#196F3D',
  					900: '#145A32',
  				},
  				// 서브 컬러: 스카이 블루
  				secondary: {
  					DEFAULT: '#3B82F6',
  					light: '#60A5FA',
  					lighter: '#93BBFD',
  					dark: '#2563EB',
  					darker: '#1D4ED8',
  					50: '#EFF6FF',
  					100: '#DBEAFE',
  					200: '#BFDBFE',
  					300: '#93C5FD',
  					400: '#60A5FA',
  					500: '#3B82F6',
  					600: '#2563EB',
  					700: '#1D4ED8',
  					800: '#1E40AF',
  					900: '#1E3A8A',
  				},
  				// 베이스 컬러: 크림 화이트
  				cream: {
  					DEFAULT: '#FDF9F0',
  					light: '#FFFEF9',
  					dark: '#FAF4E8',
  					darker: '#F5EDD8',
  					50: '#FFFFFE',
  					100: '#FFFEF9',
  					200: '#FDF9F0',
  					300: '#FAF4E8',
  					400: '#F5EDD8',
  					500: '#F0E5C8',
  					600: '#E8DAB5',
  					700: '#DCC89A',
  					800: '#C9B480',
  					900: '#B39E66',
  				},
  				// 추가 액센트 컬러
  				accent: {
  					DEFAULT: '#27AE60',
  					light: '#2ECC71',
  					dark: '#229954',
  				},
  				// Danger/경고 색상
  				danger: {
  					DEFAULT: '#DC3545',
  					light: '#E74C5C',
  					lighter: '#F08080',
  					dark: '#C82333',
  					darker: '#A71D2A',
  					50: '#FEF2F2',
  					100: '#FEE2E2',
  					200: '#FECACA',
  					300: '#FCA5A5',
  					400: '#F87171',
  					500: '#DC3545',
  					600: '#C82333',
  					700: '#A71D2A',
  					800: '#7F1D1D',
  					900: '#581818',
  				},
  			},
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
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // EDUVIA GT Brand Colors — paleta institucional (Ministerio de Educación de Guatemala)
        sigeb: {
          blue: '#3D8EC7', // azul celeste bandera — transparencia, confianza, cielo de Guatemala
          'blue-dark': '#0F3D63', // azul institucional MINEDUC — rigor, gobierno
          light: '#7FB4DF', // celeste claro
          white: '#FFFFFF', // transparencia, paz
          gray: '#F4F7FA',
          gold: '#D4A72C', // oro quetzal — oportunidades, excelencia académica
          green: '#2E9E4F', // verde quetzal — educación, crecimiento, esperanza
        },
        // Brutalista / maximalismo (tonalidad institucional)
        brutal: {
          tinta: '#18233A', // tinta azul-gris institucional
          papel: '#F5F7FA', // blanco institucional frío — transparencia documental
          blanco: '#FFFFFF',
          cian: '#3D8EC7', // azul celeste bandera (acentos)
          rojo: '#E5484D', // error
          naranja: '#F06C1F', // warning
          lima: '#4CAF6D', // éxito / educación
          rosa: '#E8669C',
          indigo: '#5A5CD8',
          teal: '#2A9D8F',
          gold: '#D4A72C', // oro quetzal
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        brut: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        brutal: '0px',
        brutalmd: '0px',
        brutalcard: '6px',
      },
      boxShadow: {
        brutal: '6px 6px 0 0 #18233A',
        'brutal-sm': '4px 4px 0 0 #18233A',
        'brutal-cyan': '6px 6px 0 0 #3D8EC7',
        'brutal-gold': '6px 6px 0 0 #D4A72C',
      },
      borderWidth: {
        brutal: '3px',
      },
      rotate: {
        brutal: '-1.5deg',
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
    content: ['./resources/views/**/*.blade.php', './resources/js/**/*.{ts,tsx}'],
    theme: {
        extend: {
            fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
        },
    },
    plugins: [],
};

import { execSync } from 'child_process';

const activeAdminPath = execSync('bundle show activeadmin', { encoding: 'utf-8' }).trim();

// Note: ActiveAdmin plugin requires Tailwind 3.x API which isn't compatible with Tailwind 4.x
// We use plain Tailwind CSS with custom styles instead

export default {
  content: [
    `${activeAdminPath}/app/views/**/*.{arb,erb,html,rb}`,
    './app/admin/**/*.{arb,erb,html,rb}',
    './app/views/active_admin/**/*.{arb,erb,html,rb}',
    './app/views/admin/**/*.{arb,erb,html,rb}',
    './app/views/layouts/active_admin*.{erb,html}',
    './app/javascript/**/*.js'
  ],
  darkMode: "selector",
  plugins: []
}

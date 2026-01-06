import { execSync } from 'child_process';

// Try to find activeadmin gem path, with fallback for Docker builds
let activeAdminPath;
try {
  activeAdminPath = execSync('bundle show activeadmin', { encoding: 'utf-8' }).trim();
} catch {
  // In Docker, use the standard gem path (may vary by exact version)
  // If path doesn't exist, Tailwind will just ignore it
  activeAdminPath = '/usr/local/bundle/ruby/3.3.0/gems/activeadmin-4.0.0.beta19';
}

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

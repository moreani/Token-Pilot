import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const email = process.argv[2];

function getGoogleClientId() {
  if (process.env.ANTIGRAVITY_CLIENT_ID) return process.env.ANTIGRAVITY_CLIENT_ID;
  const home = process.env.HOME || '';
  const candidatePath = path.join(
    home,
    'Desktop',
    'Antigravity Tools',
    'AntigravityManager',
    'src',
    'modules',
    'cloud-account',
    'services',
    'GoogleAPIService.ts'
  );
  if (fs.existsSync(candidatePath)) {
    try {
      const content = fs.readFileSync(candidatePath, 'utf8');
      const match = content.match(/CLIENT_ID\s*=\s*['"]([^'"]+)['"]/);
      if (match) return match[1];
    } catch {
      // ignore
    }
  }
  return '';
}

const clientId = getGoogleClientId();

const scopes = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cclog',
  'https://www.googleapis.com/auth/experimentsandconfigs',
  'https://www.googleapis.com/auth/aicode'
].join(' ');

const redirectUri = 'http://localhost:8888/oauth-callback';

const params = new URLSearchParams({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
  response_type: 'code',
  client_id: clientId,
  redirect_uri: redirectUri,
  include_granted_scopes: 'true',
  state: `tokenpilot-${Date.now()}`
});

if (email) {
  params.set('login_hint', email);
}

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

console.log('----------------------------------------------------');
console.log('TokenPilot Google OAuth Connect');
if (email) {
  console.log(`Connecting account: ${email}`);
}
console.log('Opening official Google OAuth sign-in page in your browser...');
console.log('----------------------------------------------------');

try {
  if (process.platform === 'darwin') {
    execSync(`open "${authUrl}"`);
  } else if (process.platform === 'win32') {
    execSync(`start "" "${authUrl}"`);
  } else {
    execSync(`xdg-open "${authUrl}"`);
  }
  console.log('Browser opened! Please click "Allow" in your browser.');
} catch (e) {
  console.log('Could not automatically open browser. Please open this link:');
  console.log(authUrl);
}

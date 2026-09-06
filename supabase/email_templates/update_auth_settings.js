const fs = require('fs');
const path = require('path');

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'umclynjzdybfvvpdjqwv';

async function updateAuthConfig() {
  const htmlTemplate = fs.readFileSync(path.join(__dirname, 'otp_email_template.html'), 'utf8');

  const payload = {
    site_url: 'http://localhost:5173',
    uri_allow_list: 'http://localhost:5173/**,http://localhost:3000/**,http://localhost:5174/**,http://127.0.0.1:5173/**',
    mailer_subjects_magic_link: 'Your OpenHealth Verification Code: {{ .Token }}',
    mailer_templates_magic_link_content: htmlTemplate,
    mailer_subjects_confirmation: 'Confirm your OpenHealth Account: {{ .Token }}',
    mailer_templates_confirmation_content: htmlTemplate,
    mailer_subjects_recovery: 'Reset your OpenHealth Password',
    mailer_otp_exp: 600, // 10 minutes
    rate_limit_email_sent: 60,
  };

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to update auth config:', err);
  } else {
    const data = await res.json();
    console.log('✓ Successfully updated Supabase Auth URL and Email Template settings!');
    console.log(' - Site URL:', data.site_url);
    console.log(' - Allowed Redirects:', data.uri_allow_list);
    console.log(' - Magic Link Subject:', data.mailer_subjects_magic_link);
    console.log(' - Confirmation Subject:', data.mailer_subjects_confirmation);
  }
}

updateAuthConfig();

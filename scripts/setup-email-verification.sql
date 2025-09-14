-- Update auth settings for email verification
UPDATE auth.config 
SET 
  site_url = 'http://localhost:3000',
  email_confirm_url = 'http://localhost:3000/auth/verify',
  email_change_confirm_url = 'http://localhost:3000/auth/verify',
  password_reset_confirm_url = 'http://localhost:3000/auth/reset-password'
WHERE id = 1;

-- Enable email confirmations
UPDATE auth.config SET email_confirm = true WHERE id = 1;

-- Set email templates (optional - you can customize these in Supabase dashboard)
INSERT INTO auth.email_templates (template_name, subject, body_html, body_text) VALUES
('confirmation', 
 'Confirm your email address for Artistly',
 '<h2>Welcome to Artistly!</h2><p>Please click the link below to verify your email address:</p><p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p><p>If you did not create an account, please ignore this email.</p>',
 'Welcome to Artistly! Please click the link below to verify your email address: {{ .ConfirmationURL }} If you did not create an account, please ignore this email.'
) ON CONFLICT (template_name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text;

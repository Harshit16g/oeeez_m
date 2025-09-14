-- Update auth settings for production email verification
UPDATE auth.config 
SET 
  site_url = 'https://artistlydotcom.vercel.app',
  email_confirm_url = 'https://artistlydotcom.vercel.app/auth/verify',
  email_change_confirm_url = 'https://artistlydotcom.vercel.app/auth/verify',
  password_reset_confirm_url = 'https://artistlydotcom.vercel.app/auth/reset-password'
WHERE id = 1;

-- Enable email confirmations
UPDATE auth.config SET email_confirm = true WHERE id = 1;

-- Set email templates for production
INSERT INTO auth.email_templates (template_name, subject, body_html, body_text) VALUES
('confirmation', 
 'Confirm your email address for Artistly',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #7c3aed; margin: 0;">🎵 Artistly</h1>
      <p style="color: #6b7280; margin: 5px 0;">India''s Premier Artist Booking Platform</p>
    </div>
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
      <h2 style="color: white; margin: 0 0 15px 0;">Welcome to Artistly!</h2>
      <p style="color: rgba(255,255,255,0.9); margin: 0;">Please verify your email address to get started</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Verify Email Address</a>
    </div>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>What happens next?</strong></p>
      <ul style="color: #6b7280; font-size: 14px; margin: 10px 0;">
        <li>Complete your profile setup</li>
        <li>Browse amazing artists</li>
        <li>Start booking for your events</li>
      </ul>
    </div>
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
      If you didn''t create an account with Artistly, please ignore this email.<br>
      This link will expire in 24 hours for security reasons.
    </p>
  </div>',
 'Welcome to Artistly! 

Please click the link below to verify your email address: 
{{ .ConfirmationURL }}

What happens next?
- Complete your profile setup
- Browse amazing artists  
- Start booking for your events

If you didn''t create an account with Artistly, please ignore this email.
This link will expire in 24 hours for security reasons.'
) ON CONFLICT (template_name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text;

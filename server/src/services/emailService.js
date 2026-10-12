const nodemailer = require('nodemailer');
const emailjs = require('@emailjs/nodejs');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: parseInt(process.env.SMTP_PORT || '465') === 465,
    auth: {
      user: process.env.SMTP_USER || 'resend',
      pass: process.env.SMTP_PASS || 'your_resend_api_key'
    }
  });
};

exports.sendOtpEmail = async (email, otpCode) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (serviceId && templateId && publicKey) {
    try {
      const timeLimit = new Date(Date.now() + 10 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await emailjs.send(
        serviceId,
        templateId,
        {
          email: email,
          passcode: otpCode,
          time: timeLimit
        },
        {
          publicKey: publicKey,
          privateKey: privateKey
        }
      );
      console.log(`[EmailJS] OTP ${otpCode} sent to ${email}`);
      return true;
    } catch (err) {
      console.error('[EmailJS] Error sending email:', err.message || err);
      throw new Error('Failed to send email via EmailJS');
    }
  }

  const pass = process.env.SMTP_PASS || 'your_resend_api_key';
  
  if (pass === 'your_resend_api_key') {
    console.log('\n--------------------------------------------------');
    console.log(`[DEVELOPMENT MODE] Email to: ${email}`);
    console.log(`[DEVELOPMENT MODE] OTP Code: ${otpCode}`);
    console.log('--------------------------------------------------\n');
    return Promise.resolve(true); // Simulate success
  }

  const transporter = createTransporter();
  
  const htmlTemplate = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A3122B;">Life Connect</h2>
      <p>Hello,</p>
      <p>Your email verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1F1214; padding: 20px; background: #FFF7F8; text-align: center; border-radius: 8px;">
        ${otpCode}
      </div>
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        This code expires in 10 minutes. Please ignore this email if you did not request it.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">
        Tamil Nadu Life Connect &bull; Blood Donation & Medicine Sharing
      </p>
    </div>
  `;

  const textTemplate = `Your Life Connect email verification code is: ${otpCode}\n\nThis code expires in 10 minutes. Ignore if you did not request this.`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Life Connect <noreply@lifeconnect.example.com>',
    to: email,
    subject: `${otpCode} is your Life Connect verification code`,
    text: textTemplate,
    html: htmlTemplate
  });
};

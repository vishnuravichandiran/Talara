const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '')));

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// API endpoint to send OTP
app.post('/api/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Talara Login OTP',
    text: `Your one-time password (OTP) to login to Talara is: ${otp}. It is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; background-color: #f4efe6;">
        <h2 style="color: #b87523;">Talara Botanicals</h2>
        <p style="font-size: 16px; color: #141b17;">You requested to sign in. Your verification code is:</p>
        <div style="margin: 30px 0; padding: 15px; background-color: #ffffff; border-radius: 8px; border: 1px solid #d9923b;">
          <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px; color: #141b17;">${otp}</h1>
        </div>
        <p style="font-size: 12px; color: #6e8176;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});
// API endpoint to send Partnership Email
app.post('/api/send-partnership', async (req, res) => {
  const { name, email, company, role, inquiry } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'talara.bridge@gmail.com', // Sending to talara owner
    subject: `New Partnership Inquiry from ${company}`,
    text: `New Partnership Inquiry\nName: ${name}\nEmail: ${email}\nCompany: ${company}\nRole: ${role}\nMessage: ${inquiry}`,
    html: `
      <h2>New Partnership Inquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Role:</strong> ${role}</p>
      <p><strong>Message:</strong></p>
      <p>${inquiry}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Partnership email sent' });
  } catch (error) {
    console.error('Error sending partnership email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// API endpoint to send Order Email
app.post('/api/send-order', async (req, res) => {
  const { name, contact, address, cart, total } = req.body;

  let productsTable = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
      <thead>
        <tr style="background-color: #f4efe6;">
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Qty</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
  `;

  cart.forEach(item => {
    productsTable += `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.name} (${item.variant})</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${item.price}</td>
      </tr>
    `;
  });

  productsTable += `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px; border: 1px solid #ddd; text-align: right;"><strong>Total:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;"><strong>₹${total}</strong></td>
        </tr>
      </tfoot>
    </table>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'talara.bridge@gmail.com', // Sending to talara owner
    subject: `New Order Received from ${name}`,
    html: `
      <h2>New Order Details</h2>
      <p><strong>Customer Name:</strong> ${name}</p>
      <p><strong>Contact/Email:</strong> ${contact}</p>
      <p><strong>Delivery Address:</strong> ${address}</p>
      <h3>Order Summary</h3>
      ${productsTable}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Order email sent' });
  } catch (error) {
    console.error('Error sending order email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Make sure you have created a .env file with EMAIL_USER and EMAIL_PASS`);
  });
}

// Export the app for Vercel Serverless Functions
module.exports = app;

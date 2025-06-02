import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail', // or any other email service 
  auth: {
    user: process.env.NODEMAILER_EMAIL, // your email
    pass: process.env.NODEMAILER_EMAIL_PASS, // your email password
  },
});

const sendEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to,
    subject: "Email Account Verification",
    html: `<p> Welcome to chitchat!\n Your OTP for email verification is: <strong>${otp}</strong>. It is valid for 2 minutes.</p>` ,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;

import nodemailer from "nodemailer";

export async function POST(request) {
  const { email, name } = await request.json();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Welcome to Our App!",
      text: `Hi ${name},\n\nThank you for signing up!`,
    });

    return new Response(JSON.stringify({ message: "Email sent" }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
  }
}
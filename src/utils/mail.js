import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Task Manager",
    link: "http://taskmanagerlink.com"
  }
});

const sendEmail = async (options) => {
  const emailText = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHTML = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS
    }
  });

  const mail = {
    from: "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailHTML
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error(
      "Email service failed. Check Mailtrap credentials in .env"
    );
    console.error(error);
  }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to our app! We are excited to have you onboard.",
      action: {
        instructions: "To verify your email, click the button below:",
        button: {
          color: "#254834",
          text: "Verify your email",
          link: verificationUrl
        }
      },
      outro:
        "Need help or have questions? Just reply to this email—we’d love to help."
    }
  };
};

const forgotpasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "We received a request to reset your account password.",
      action: {
        instructions:
          "To reset your password, click the button below:",
        button: {
          color: "#254834",
          text: "Reset password",
          link: passwordResetUrl
        }
      },
      outro:
        "If you did not request this, you can safely ignore this email."
    }
  };
};

export {
  emailVerificationMailgenContent,
  forgotpasswordMailgenContent,
  sendEmail
};

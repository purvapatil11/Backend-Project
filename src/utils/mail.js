import Mailgen from "mailgen";
import nodemailer from "nodemailer"


const sendEmail = async (options) => {
    new Mailgen({
        theme:"default",
        products:{
            name: "Task Manager",
            link:"http://taskmanagerlink.com"
        }
    })
    const emailTextual = mailGenerator.generateplaintext(options.mailgenContent)

    const emailHTML = mailGenerator.generateplaintext(options.mailgenContent)
    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth:{
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    })
    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject:options.subject,
        text: emailTextual,
        html:emailHTML
    }
try {
    await transporter.sendMail(mail)
} catch (error) {
    console.error("Email service failed silently.make sure that have provided the mail trap credentials in the .env file")
    console.log(error);
    
}

}
const emailVerificationMailgenContent  = (username, verificationUrl) =>{
    return {
        body:{
            name: username,
            intro: "welcome to our App!!, we are excited to see you on board",
            action: {
                instructions: "To verify you email please click on the following button",
            },
            button:{
                color: "#254834",
                text: "verify your email",
                link: "verificationUrl"
            },
        },
        outro: "Need help or have questions just reply to this email, we'd to help."
    }
}
const forgotpasswordMailgenContent  = (username, passwordResetUrl) =>{
    return {
        body:{
            name: username,
            intro: "we got a request to reset the password of you account",
            action: {
                instructions: "To reset the password click on the following button or link",
            },
            button:{
                color: "#254834",
                text: "Reset password",
                link: "passwordResetUrl",
            },
        },
        outro: "Need help or have questions just reply to this email, we'd to help."
    }
}
export {
    emailVerificationMailgenContent,
    forgotpasswordMailgenContent,
    sendEmail,
}

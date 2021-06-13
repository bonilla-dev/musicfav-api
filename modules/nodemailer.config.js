const nodemailer = require("nodemailer")

class Mailer {
  constructor() {
    this.testAccount = null
    this.transporter = null
  }

  async initialize() {
    this.testAccount = await nodemailer.createTestAccount()

    this.transporter = nodemailer.createTransport({
      host: this.testAccount.smtp.host,
      port: this.testAccount.smtp.port,
      secure: this.testAccount.smtp.secure,
      auth: {
        user: this.testAccount.user, // generated ethereal user
        pass: this.testAccount.pass // generated ethereal password
      },
      tls: {
         rejectUnauthorized: false
    }
    });
  }
}

let mailer = new Mailer()



module.exports = new Mailer()

module.exports.sendConfirmationEmail = (name, email, confirmationCode) => {
  transport.sendMail({
    from: user,
    to: email,
    subject: "Please confirm your account",
    html: `<h1>Email Confirmation</h1>
        <h2>Hello ${name}</h2>
        <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
        <a href=http://localhost:8080/confirm/${confirmationCode}> Click here</a>
        </div>`,
  }).catch(err => console.log(err));
};
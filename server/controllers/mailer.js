import nodemailer from "nodemailer";
import Mailgen from "mailgen";

import ENV from "../config.js";

// https:/ethereal.email/create\

let nodeConfig = {
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: ENV.EMAIL, // generated ethereal user
    pass: ENV.PASSWORD, // generated ethereal pass
  },
};

let transporter = nodemailer.createTransport(nodeConfig);

let MailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Mailgen",
    link: 'https://mailger.js/'
  }
})

/** POST: http://localhost:8080/api/registerMail 
  * @param: {
    "username": "example123"
    "userEmail" : "admin123",
    "text" : "",
    "subject" : "",
}

*/

export const registerMail = async (req, res) => {
  const {username, userEmail, text, subject } = req.body;

 // body of the email
  var email = {
    body: {
      name: username,
      intro: text || "Welcome to my \"life\"",
      outro: "Need me, or my question ka? Pwede bang dito ka \"lang\""
    }
  };

  var emailBody = MailGenerator.generate(email);

  let message = {
    from: ENV.EMAIL,
    to: userEmail,
    subject: subject || "Signup Successful",
    html: emailBody
  };

  // send email using sendMail method
  transporter.sendMail(message)
    .then(() => {
      return res.status(201).send({ msg: "You should receive an email from us" });
    })
    .catch(error => res.status(500).send({ error }));
};

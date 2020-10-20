const { default: createSentDate } = require('../queries/createSentDate');
const { default: wellKnownServices } = require('../data/wellKnownServices')
const { default: moveEmailTofolder } = require('../queries/moveEmailTofolder')
const nodemailer = require("nodemailer");


class sendEmails {

  constructor() {
    this.graph = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';
    this.smtpOrRest = process.env.SMTP_OR_REST;
    this.wellKnown = process.env.WELL_KNOWN_SERVICE_OR_SERVER;
    this.nodemailerServices = wellKnownServices;
    this.emailAddress = process.env.EMAIL_ADDRESS;
    this.emalPass = process.env.EMAIL_PASSWORD
    this.fromName = process.env.FROM_NAME || '';
    this.hoursDeliveringTimeout = process.env.HOURS_DELIVERING_TIMEOUT || 1;
  }

  async sendEmail(email) {
    console.log(` > Email uuid:  ${email.uuid}`)

    // Check for a send date
    if (!email.sentDate) {
      await createSentDate(this.graph, email)
      console.log(` > No send date found, created a send date.`)
    }

    // Check for timeout
    if (this._filterDeliveringTimeout(email)) {
      await setEmailToMailbox(graphName, email.uuid, "failbox");
      console.log(`Timeout reached, message moved to failbox: ${email.uuid}`);
      return;
    }


    try {

      switch (this.smtpOrRest) {
        case "smtp":
          console.log("Protocol: SMTP")
          this._sendSMTP(email)
          break;

        case "rest":
          console.log(`Sending emails via 'rest' is not supported at the moment.`);
          break;

        default:
          console.log(`SMTP_OR_REST should be 'smtp' or 'rest'`);
      }
    }

    catch (err) {
      console.log(err)
    }
  }

  _filterDeliveringTimeout(email) {
    let modifiedDate = new Date(email.sentDate);
    let currentDate = new Date();
    return ((currentDate - modifiedDate) / (1000 * 60 * 60)) <= parseInt(this.hoursDeliveringTimeout);
  }

  _sendSMTP(email) {
    if (!((this.nodemailerServices.indexOf(this.wellKnown) > (-1)) || (this.nodemailerServices == 'server'))) {
      return console.log(`WELL_KNOWN_SERVICE_OR_SERVER should be 'server' or a known service by Nodemailer`);
    }

    nodemailer.createTestAccount((err, account) => {
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: account.user, // generated ethereal user
          pass: account.pass  // generated ethereal password
        }
      });

      transporter.sendMail().then(info => {
        console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
      });
    });
  }

}

export default sendEmails
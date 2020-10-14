const { default: createSentDate } = require('../queries/createSentDate');
const { default: wellKnownServices} = require('../data/wellKnownServices')


class sendEmails {

  constructor(){
    this.graph = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';
    this.smtpOrRest = process.env.SMTP_OR_REST;
    this.wellKnown = process.env.WELL_KNOWN_SERVICE_OR_SERVER;
    this.nodemailerServices = wellKnownServices;
    this.emailAddress = process.env.EMAIL_ADDRESS;
    this.emalPass = process.env.EMAIL_PASSWORD
  }

  async sendEmail(email){
    console.log(`Start sending email ${email.uuid.value}`)
    if(!email.sentDate){
      await createSentDate(this.graph, email)
    }

    if( this.smtpOrRest == 'smtp'){
      _sendSMTP(email)
    }

  }

  _sendSMTP(email) {
    if (!((this.nodemailerServices.indexOf(this.wellKnown) > (-1)) || (this.nodemailerServices == 'server'))) {
      return console.log(`WELL_KNOWN_SERVICE_OR_SERVER should be 'server' or a known service by Nodemailer`);
    }

    console.log("sending through smtp")
  }
}

export default sendEmails
// IMPORTS
const { default: nodemailerServices } = require('../../data/nodeMailerServices');
const { default: moveEmailToFolder } = require("../../queries/moveEmailToFolder");
const { default: updateEmailId } = require('../../queries/updateEmailId');
const { default: createSentDate } = require('../../queries/createSentDate');
const nodemailer = require("nodemailer");

// ENV
const wkServiceOrServer = process.env.WELL_KNOWN_SERVICE_OR_SERVER;
const fromName = process.env.FROM_NAME || '';
const hoursDeliveringTimeout = process.env.HOURS_DELIVERING_TIMEOUT || 1;
const graph = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';

// MAIN FUNCTION
function smtp(emails) {
  let count = 0;
  emails.forEach(async email => {
    count++
    try {
      _sendEmailToSending(email)
      _checkSentDate(email)
      
      _checkTimeout(email)
      
      _sendMail(email, count)
    } catch (err) {
      console.log(err)
    }
  });
}

// SUB FUNCTIONS CALLED BY MAIN

async function _sendEmailToSending(email){
  await moveEmailToFolder(graph, email.uuid, "sending");
}

async function _checkSentDate(email) {
  if (!email.sentDate || email.sentDate == "") {
    await createSentDate(graph, email)

    console.log(` > No send date found, a send date has been created.`)
  }
}

async function _checkTimeout(email) {
  let modifiedDate = new Date(email.sentDate);
  let currentDate = new Date();
  let timeout = ((currentDate - modifiedDate) / (1000 * 60 * 60)) <= parseInt(hoursDeliveringTimeout);

  if (timeout) {
    await moveEmailToFolder(graph, email.uuid, "failbox");
    ;
    throw `*** FAILED: Timeout reached, message moved to failbox: ${email.uuid} ***`;
  }
}

async function _sendMail(email, count) {
  let transporter = null;

  if (!((nodemailerServices.indexOf(wkServiceOrServer) > (-1)) || (nodemailerServices == 'server'))) {
    throw ` > WELL_KNOWN_SERVICE_OR_SERVER should be 'server' or a known service by Nodemailer`;
  }

  if (wkServiceOrServer.toLowerCase() == "server") {
    transporter = nodemailer.createTransport({
      service: wellKnownServiceOrServer,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  if (wkServiceOrServer.toLowerCase() != "server") {
    console.log("!server")
    // create reusable transporter object using the default SMTP transport
    transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: process.env.PORT,
      secureConnection: process.env.SECURE_CONNECTION || false,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  const attachments = (email.attachments || []).map((attachment) => {
    return {
      filename: attachment.filename,
      path: attachment.dataSource
    };
  });

  const mailProperties = {
    from: `${fromName} ${email.messageFrom}`,
    to: email.emailTo,
    cc: email.emailCc,
    bcc: email.emailBcc,
    subject: email.messageSubject,
    text: email.plainTextMessageContent,
    html: email.htmlMessageContent,
    attachments: attachments
  };

  try{

    transporter.sendMail(mailProperties, async (failed, success) => {
      if (failed) {

        await moveEmailToFolder(graph, email.uuid, "failbox");
        
        console.log(` > The destination server responded with an error. Email ${count} send to Failbox.`)
        console.log(` > ${failed}`)

      } else {
        console.log(` > Email ${count} UUID:`, email.uuid);
        await moveEmailToFolder(graph, email.uuid, "sentbox");
        console.log(` > Message moved to sentbox: ${email.uuid}`);
        await updateEmailId(graph, email.messageId, success.messageId);
        console.log(` > MessageId updated from ${email.messageId} to ${success.messageId}`);
        email.messageId = success.messageId;
      }
    })
  }

  catch(err) {
    console.log(err)
  }
    
}

export default smtp;
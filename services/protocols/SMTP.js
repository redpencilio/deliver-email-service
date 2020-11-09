// IMPORTS
import nodemailerServices from '../../data/node-mailer-services';
import moveEmailToFolder from "../../queries/move-email-to-folder";
import updateEmailId from '../../queries/update-email-Id';
import createSentDate from '../../queries/create-sent-date';

const nodemailer = require("nodemailer");
const sgTransport = require('nodemailer-sendgrid-transport');

// ENV
import { 
  FROM_NAME, 
  GRAPH, 
  HOURS_DELIVERING_TIMEOUT, 
  WELL_KNOWN_SERVICE 
} from '../../config';

// MAIN FUNCTION
async function sendSMTP(email, count){
  try {
    await moveEmailToFolder(GRAPH, email, "sending");
    await _checkSentDate(email, count);
    await _sendMail(email, count);
  } catch (err) {
   console.log(err);
  }
}


// SUB FUNCTIONS
async function _checkSentDate(email, count) {
  if (!email.sentDate) {
    await createSentDate(GRAPH, email);
    console.log(` > Email ${count}: No send date found, a send date has been created.`);
  }
}

async function _sendMail(email, count) {
  let transporter = null;

  if (WELL_KNOWN_SERVICE == "sendgrid") {
    transporter = nodemailer.createTransport(sgTransport(
        {
          auth: {
              api_key: process.env.EMAIL_PASSWORD
          }
      }
    ));
  
  } else if (!(nodemailerServices.indexOf(WELL_KNOWN_SERVICE) == -1)) {
    transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: process.env.PORT,
      secureConnection: process.env.SECURE_CONNECTION || false,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    throw new Error('** Something went wrong when creating a transport using nodemailer. **')
  }



  const attachments = (email.attachments || []).map((attachment) => {
    return {
      filename: attachment.filename,
      path: attachment.dataSource
    }
  });

  const mailProperties = {
    from: `${FROM_NAME} ${email.messageFrom}`,
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
    
      if(failed){
        let modifiedDate = new Date(email.sentDate);
        let currentDate = new Date();
        let timeout = ((currentDate - modifiedDate) / (1000 * 60 * 60)) <= parseInt(HOURS_DELIVERING_TIMEOUT);

        if(!timeout){
          await setLastAttempt(GRAPH, email)
          await moveEmailToFolder(GRAPH, email, "outbox");
          console.log(` > Email ${count}: The destination server responded with an error. Email set to be retried at next cronjob.`);
          console.dir(` > Email ${count}: ${failed}`);

        } else {
          moveEmailToFolder(GRAPH, email, "failbox");
          console.log(` > Email ${count}: The destination server responded with an error. Email moved to failbox.`);
          console.dir(` > Email ${count}: ${failed}`);
        }
        
      } else {
        moveEmailToFolder(GRAPH, email, "sentbox");
        updateEmailId(graph, email, success.messageId);
        email.messageId = success.messageId;
        console.log(` > Email ${count}: UUID = ${email.uuid}`);
        console.log(` > Email ${count}: Email moved to sentbox`);
        console.log(` > Email ${count}: Email message ID updated`);
        console.log(` > Email ${count}: MessageId updated from ${email.messageId} to ${success.messageId}`);
        console.log(` > Email ${count}: Preview URL %s`, nodemailer.getTestMessageUrl(success));
        }
      });
    }

  catch(err) {
    console.dir(err);
  }
}

export default sendSMTP;
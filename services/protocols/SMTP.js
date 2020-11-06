// IMPORTS
import nodemailerServices from '../../data/nodeMailerServices';
import moveEmailToFolder from "../../queries/moveEmailToFolder";
import updateEmailId from '../../queries/updateEmailId';
import createSentDate from '../../queries/createSentDate';

const nodemailer = require("nodemailer");
const sgTransport = require('nodemailer-sendgrid-transport');

// ENV
import { 
  FROM_NAME, 
  GRAPH, 
  HOURS_DELIVERING_TIMEOUT, 
  WELL_KNOWN_SERVICE_OR_SERVER 
} from '../../config';


// MAIN FUNCTION
async function smtp(emails){
  let count = 0;
  try {
    emails.forEach(async email => {
      count++;
        await moveEmailToFolder(GRAPH, email.uuid, "sentbox");
        await _checkSentDate(email);
        await _checkTimeout(email);
        await _sendMail(email, count);
    });
  } catch (err) {
   console.log(err);
  }
}


// SUB FUNCTIONS
async function _checkSentDate(email) {
  if (!email.sentDate) {
    await createSentDate(GRAPH, email);
    console.log(` >>> No send date found, a send date has been created.`);
  }
}

async function _checkTimeout(email) {
  let modifiedDate = new Date(email.sentDate);
  let currentDate = new Date();
  let timeout = ((currentDate - modifiedDate) / (1000 * 60 * 60)) <= parseInt(HOURS_DELIVERING_TIMEOUT);

  if (timeout) {
    moveEmailToFolder(GRAPH, email.uuid, "failbox");
    throw `*** FAILED: Timeout reached, message moved to failbox: ${email.uuid} ***`;
  };
}

async function _sendMail(email, count) {
  let transporter = null;
  if (!((nodemailerServices.indexOf(WELL_KNOWN_SERVICE_OR_SERVER) > (-1)) || (nodemailerServices == 'server'))) {
    throw ` >>> WELL_KNOWN_SERVICE_OR_SERVER should be 'server' or a known service by Nodemailer`;
  };

  if (WELL_KNOWN_SERVICE_OR_SERVER == "server") {
    transporter = nodemailer.createTransport({
      service: wellKnownServiceOrServer,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  if (WELL_KNOWN_SERVICE_OR_SERVER != "server" && WELL_KNOWN_SERVICE_OR_SERVER != "sendgrid") {
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

  if (WELL_KNOWN_SERVICE_OR_SERVER == "sendgrid") {
    transporter = nodemailer.createTransport(sgTransport(
        {
          auth: {
              api_key: process.env.EMAIL_PASSWORD
          }
      }
    ));
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
      moveEmailToFolder(GRAPH, email.uuid, "failbox");
      console.log(` > The destination server responded with an error. Email ${count} send to Failbox.`);
      console.dir(` > Email ${count}: ${failed}`);
    
      } else {
        moveEmailToFolder(GRAPH, email.uuid, "sentbox");
        // updateEmailId(graph, email.messageId, success.messageId);
        // email.messageId = success.messageId;
        console.log(` > Email ${count} UUID:`, email.uuid);
        console.log(` > Email ${count}: Message moved to sentbox: ${email.uuid}`);
        console.log(` > Email ${count}: Email message ID updated: ${email.uuid}`);
        console.log(` > Email ${count}: MessageId updated from ${email.messageId} to ${success.messageId}`);
        console.log(` > Email ${count}:  Preview URL %s`, nodemailer.getTestMessageUrl(success));
        }
      });
    }

  catch(err) {
    console.dir(err);
  }
}

export default smtp;
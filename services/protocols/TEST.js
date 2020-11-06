
// IMPORTS
import moveEmailToFolder from "../../queries/move-email-to-folder";
import updateEmailId from '../../queries/update-email-Id';
import createSentDate from '../../queries/create-sent-date';

const nodemailer = require("nodemailer");

// ENV
import { 
  GRAPH, 
  FROM_NAME 
} from "../../config";

// MAIN FUNCTION
async function sendTEST(emails){
  console.log(" >>> PROTOCOL: TEST");
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

// SUB FUNCTIONS CALLED BY MAIN

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
    await moveEmailToFolder(GRAPH, email.uuid, "failbox");
    throw new Error(`*** FAILED: Timeout reached, message moved to failbox: ${email.uuid} ***`);
  }
}

async function _sendMail(email, count) {
  
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

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
  
  transporter.sendMail(mailProperties, async (failed, success) => {
    
  if(failed){
    
  await moveEmailToFolder(GRAPH, email.uuid, "failbox");
  console.log(` > The destination server responded with an error. Email ${count} send to Failbox.`);
  console.dir(` > Email ${count}: ${failed}`);

  } else {
    moveEmailToFolder(GRAPH, email.uuid, "sentbox");
    updateEmailId(GRAPH, email.messageId, success.messageId);
    console.log(` > Email ${count} UUID:`, email.uuid);
    console.log(` > Email ${count}: Message moved to sentbox: ${email.uuid}`);
    console.log(` > Email ${count}: Email message ID updated: ${email.uuid}`);
    console.log(` > Email ${count}: MessageId updated from ${email.messageId} to ${success.messageId}`);
    console.log(` > Email ${count}:  Preview URL %s`, nodemailer.getTestMessageUrl(success));
    }
  })

}

export default sendTEST;
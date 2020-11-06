
// IMPORTS
import moveEmailToFolder from "../../queries/moveEmailToFolder";
import updateEmailId from '../../queries/updateEmailId';
import createSentDate from '../../queries/createSentDate';
const nodemailer = require("nodemailer");

// ENV
const fromName = process.env.FROM_NAME || '';
const hoursDeliveringTimeout = process.env.HOURS_DELIVERING_TIMEOUT || 1;
const graph = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';

// MAIN FUNCTION
async function test(emails){
  console.log(" >>> PROTOCOL: TEST");
  let count = 0;
  try {
    emails.forEach(async email => {
      count++;
        await moveEmailToFolder(graph, email.uuid, "sentbox");
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
    await createSentDate(graph, email);
    console.log(` >>> No send date found, a send date has been created.`);
  }
}

async function _checkTimeout(email) {
  let modifiedDate = new Date(email.sentDate);
  let currentDate = new Date();
  let timeout = ((currentDate - modifiedDate) / (1000 * 60 * 60)) <= parseInt(hoursDeliveringTimeout);
  
  if (timeout) {
    await moveEmailToFolder(graph, email.uuid, "failbox");
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
    from: `${fromName} ${email.messageFrom}`,
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
    
  await moveEmailToFolder(graph, email.uuid, "failbox");
  console.log(` > The destination server responded with an error. Email ${count} send to Failbox.`);
  console.dir(` > Email ${count}: ${failed}`);

  } else {
    moveEmailToFolder(graph, email.uuid, "sentbox");
    updateEmailId(graph, email.messageId, success.messageId);
    console.log(` > Email ${count} UUID:`, email.uuid);
    console.log(` > Email ${count}: Message moved to sentbox: ${email.uuid}`);
    console.log(` > Email ${count}: Email message ID updated: ${email.uuid}`);
    console.log(` > Email ${count}: MessageId updated from ${email.messageId} to ${success.messageId}`);
    console.log(` > Email ${count}:  Preview URL %s`, nodemailer.getTestMessageUrl(success));
    }
  })

}

export default test;
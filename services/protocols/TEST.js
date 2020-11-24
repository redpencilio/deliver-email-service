
/** IMPORTS */ 
import moveEmailToFolder from "../../queries/move-email-to-folder";
import updateEmailId from '../../queries/update-email-Id';
import createSentDate from '../../queries/create-sent-date';
import setLastAttempt from "../../queries/set-last-attempt";
const nodemailer = require("nodemailer");

/** ENV */ 
import { 
  GRAPH, 
  FROM_NAME,
  HOURS_DELIVERING_TIMEOUT
} from "../../config";

/**
 * TYPE: main function
 * Sends Email to sending box, checks if a sentDate exists and then calls the sendMail sub function
 * @param  {boolean} email
 * @param  {integer} count
 */
async function sendTEST(email, count){
  console.log(" >>> PROTOCOL: TEST");
  try {
    await moveEmailToFolder(GRAPH, email, "sending");
    await _checkSentDate(email, count);
    await _sendMail(email, count);
  } catch (err) {
   console.log(err);
  }
}

/**
 * TYPE: sub function
 * Checks if a sentDate has been set for the email. If not it will create a sentDate using the current time
 * @param  {object} email
 * @param  {integer} count
 */
async function _checkSentDate(email, count) {
  if (!email.sentDate) {
    await createSentDate(GRAPH, email);
    console.log(` > Email ${count}: No send date found, a send date has been created.`);
  }
}
/**
 * TYPE: sub function
 * Responsible for actually setting up and sending the email. Since the protocol is TEST, it will create a temporary test email account using Ethereal Mail.
 * Create transport > create mail object > Send the email
 * FAILED: Check if timeout is exceeded, if not send mail back to outbox for retry else move to FAILBOX
 * SUCCESS: move email to sentbox folder, update messageID
 * 
 * @param  {object} email
 * @param  {integer} count
 */
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

  if (failed) {
    const modifiedDate = new Date(email.sentDate);
    const currentDate = new Date();
    const timeout = ((currentDate - modifiedDate) / (1000 * 60 * 60)) <= parseInt(HOURS_DELIVERING_TIMEOUT);

    if (!timeout) {
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
    updateEmailId(GRAPH, email, success.messageId);
    email.messageId = success.messageId;
    console.log(` > Email ${count}: UUID = ${email.uuid}`);
    console.log(` > Email ${count}: Message moved to sentbox`);
    console.log(` > Email ${count}: Email message ID updated`);
    console.log(` > Email ${count}: MessageId updated from ${email.messageId} to ${success.messageId}`);
    console.log(` > Email ${count}: Preview URL %s`, nodemailer.getTestMessageUrl(success));
    }
  })

}

export default sendTEST;
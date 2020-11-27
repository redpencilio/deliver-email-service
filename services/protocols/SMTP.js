/** IMPORTS */
import moveEmailToFolder from "../../queries/move-email-to-folder";
import updateEmailId from '../../queries/update-email-Id';
import updateSentDate from '../../queries/update-sent-date';
import incrementRetryAttempt from "../../queries/increment-retry-attempt";
const nodemailer = require("nodemailer");
const sgTransport = require('nodemailer-sendgrid-transport');

/** ENV */
import {
  FROM_NAME,
  GRAPH,
  HOURS_DELIVERING_TIMEOUT,
  WELL_KNOWN_SERVICE,
  SECURE_CONNECTION,
  EMAIL_ADDRESS,
  EMAIL_PASSWORD,
  HOST,
  PORT,
  NODE_MAILER_SERVICES,
  MAX_RETRY_ATTEMPTS,
  MAILBOX_URI
} from '../../config';

/**
 * TYPE: main function
 * Sends Email to sending box , checks if a sentDate exists and then calls the sendMail sub function
 * @param  {boolean} email
 * @param  {integer} count
 */
async function sendSMTP(email, count){
  try {
    await moveEmailToFolder(GRAPH, MAILBOX_URI, email, "sending");
    await _ensureSentDate(email, count);
    await _sendMail(email, count);
  } catch (err) {
   console.log(err);
  }
}

/**
 * Ensures a sentDate is added to the email.
 * @param  {object} email
 * @param  {integer} count
 */
async function _ensureSentDate(email, count) {
  if (!email.sentDate) {
    await updateSentDate(GRAPH, email);
    console.log(` > Email ${count}: No send date found, a send date has been created.`);
  }
}

async function _sendMail(email, count) {
  let transporter = nodemailer.createTransport(_generateTransporterConfiguration());

  const attachments = (email.attachments || []).map((attachment) => {
    return {
      filename: attachment.filename,
      path: attachment.dataSource
    };
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

      if (failed) {
        const modifiedDate = new Date(email.sentDate);
        const currentDate = new Date();
        const timeout = ((currentDate - modifiedDate) / (1000 * 60 * 60)) <= parseInt(HOURS_DELIVERING_TIMEOUT);

        if (timeout && email.numberOfRetries >= MAX_RETRY_ATTEMPTS) {
          await moveEmailToFolder(GRAPH, MAILBOX_URI, email, "failbox");
          console.log(` > Email ${count}: The destination server responded with an error.`);
          console.log(` > Email ${count}: Max retries ${MAX_RETRY_ATTEMPTS} exceeded. Emails had been moved to failbox`);
          console.dir(` > Email ${count}: ${failed}`);

        } else {
          await incrementRetryAttempt(GRAPH, email);
          await moveEmailToFolder(GRAPH, MAILBOX_URI, email, "outbox");
          console.log(` > Email ${count}: The destination server responded with an error. Email set to be retried at next cronjob.`);
          console.log(` > Email ${count}: Attempt ${email.numberOfRetries} out of ${MAX_RETRY_ATTEMPTS}`);
          console.dir(` > Email ${count}: ${failed}`);
        }

      } else {

        await moveEmailToFolder(GRAPH, MAILBOX_URI, email, "sentbox");
        await updateEmailId(GRAPH, email, success.messageId);

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

/**
 * helps generating the correct transporter configuration
 * Assumes some global vaariables
 */
async function _generateTransporterConfiguration(){
  let configuration;

  //Order matters!
  if (WELL_KNOWN_SERVICE == "sendgrid") {
    configuration = sgTransport(
        {
          auth: {
              api_key: EMAIL_PASSWORD
          }
      }
    );
  }

  else if(WELL_KNOWN_SERVICE == "test"){
    const testAccount = await nodemailer.createTestAccount();
    const host = "smtp.ethereal.email";
    configuration = {
      host: host,
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    };
    console.log(`Generated test account on ${host} with ${testAccount.user} and ${testAccount.pass}`);
  }

  else if (NODE_MAILER_SERVICES.includes(WELL_KNOWN_SERVICE)) {
    configuration = {
      host: HOST,
      port: PORT,
      secureConnection: SECURE_CONNECTION,
      auth: {
        user: EMAIL_ADDRESS,
        pass: EMAIL_PASSWORD
      }
    };
  }

  else {
    throw new Error('** Something went wrong when creating a transport using nodemailer. **');
  }

  return configuration;
}

export default sendSMTP;

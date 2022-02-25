/** IMPORTS */
import fetchAttachmentsForEmail from "../../queries/fetch-attachments-for-email";
import moveEmailToFolder from "../../queries/move-email-to-folder";
import updateEmailId from '../../queries/update-email-id';
import ensureSentDate from "../../utils/ensure-sent-date";
import incrementRetryAttempt from "../../queries/increment-retry-attempt";
import createLog from "../../queries/create-log";
import nodemailer from 'nodemailer';
import sgTransport  from 'nodemailer-sendgrid-transport';

/** ENV */
import {
  FROM_NAME,
  HOURS_DELIVERING_TIMEOUT,
  WELL_KNOWN_SERVICE,
  SECURE_CONNECTION,
  EMAIL_ADDRESS,
  EMAIL_PASSWORD,
  HOST,
  PORT,
  NODE_MAILER_SERVICES,
  MAX_RETRY_ATTEMPTS,
  MAILBOX_URI,
  ERROR_LOGS_GRAPH,
  LOG_ERRORS
} from '../../config';

/**
 * TYPE: main function
 * Sends Email to sending box , checks if a sentDate exists and then calls the sendMail sub function
 * @param  {boolean} email
 * @param  {integer} count
 */
async function sendSMTP(email, count) {
  try {
    await ensureSentDate(email, count);
    await moveEmailToFolder(MAILBOX_URI, email, "sending");
    await _sendMail(email, count);
  }
  catch (err) {
   console.log(err);
  }
}


async function _sendMail(email, count) {
  try{
    let transporter = nodemailer.createTransport(await _generateTransporterConfiguration());
    const mailProperties = await _generateNodemailerEmailProperties(email);

    const response = await transporter.sendMail(mailProperties);

    await moveEmailToFolder(MAILBOX_URI, email, "sentbox");

    if(!response.messageId){
      console.warn(`No messageId returned for ${email.email} and ${WELL_KNOWN_SERVICE}`);
    }

    await updateEmailId(email, response.messageId || '');

    console.log(`Email ${count}: URI = ${email.email}`);
    console.log(`Email ${count}: Email moved to sentbox`);
    console.log(`Email ${count}: Email message ID updated`);
    console.log(`Email ${count}: MessageId updated from ${email.messageId} to ${response.messageId}`);
    console.log(`Email ${count}: Preview URL %s`, nodemailer.getTestMessageUrl(response));
  }

  catch(err) {
    console.dir(err);

    const modifiedDate = new Date(email.sentDate);
    const currentDate = new Date();
    const timeout = ((currentDate - modifiedDate) / (1000 * 60 * 60)) <= parseInt(HOURS_DELIVERING_TIMEOUT);

    if (timeout && email.numberOfRetries >= MAX_RETRY_ATTEMPTS) {
      await moveEmailToFolder(MAILBOX_URI, email, "failbox");
      console.log(`Email ${count}: The destination server responded with an error.`);
      console.log(`Email ${count}: Max retries ${MAX_RETRY_ATTEMPTS} exceeded. Emails had been moved to failbox`);
      console.dir(`Email ${count}: ${err}`);

      if(LOG_ERRORS){
        await createLog(ERROR_LOGS_GRAPH, email.email, `${err}`)
      }
    }
    else {
      await incrementRetryAttempt(email);
      await moveEmailToFolder(MAILBOX_URI, email, "outbox");
      console.log(`Email ${count}: The destination server responded with an error. Email set to be retried at next cronjob.`);
      console.log(`Email ${count}: Attempt ${email.numberOfRetries} out of ${MAX_RETRY_ATTEMPTS}`);
      console.dir(`Email ${count}: ${err}`);
    }
  }
}


/**
 * helps generating the correct transporter configuration
 * Assumes some global variables
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
      service: WELL_KNOWN_SERVICE,
      secureConnection: SECURE_CONNECTION,
      auth: {
        user: EMAIL_ADDRESS,
        pass: EMAIL_PASSWORD
      }
    };
  }

  else if(HOST && PORT){
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
    throw new Error('** Wrong or insufficient connection parameters to connect to the mail server **');
  }

  return configuration;
}

async function _generateNodemailerEmailProperties(email){
  const attachments = [];
  const attachmentsData = await fetchAttachmentsForEmail(email.email);
  let fromData;

  for(const attachment of attachmentsData){
    const attachmentData = { path: attachment.path };
    if(attachment.filename){
      attachmentData.filename = attachment.filename;
    }
    attachments.push(attachmentData);
  }

  if(email.messageFrom){
    fromData = email.messageFrom;
  }
  else {
    fromData = `${FROM_NAME} <${EMAIL_ADDRESS}>`;
  }

  const mailProperties = {
    from: fromData,
    to: email.emailTo,
    cc: email.emailCc,
    bcc: email.emailBcc,
    subject: email.messageSubject,
    text: email.plainTextMessageContent,
    html: email.htmlMessageContent,
    attachments: attachments
  };

  return mailProperties;
}

export default sendSMTP;

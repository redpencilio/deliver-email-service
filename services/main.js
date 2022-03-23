/** IMPORTS */
import fetchEmails from "../queries/fetch-emails";
import moveEmailToFolder from "../queries/move-email-to-folder";
import incrementRetryAttempt from "../queries/increment-retry-attempt";
import sendSMTP from "./protocols/SMTP";
import sendMSGraphAPI from "./protocols/MS-Graph-API";
import chunkEmails from "../utils/chunk-emails";

/** ENV */
import {
  EMAIL_PROTOCOL,
  MAILBOX_URI,
  HOURS_SENDING_TIMEOUT,
  MAX_BATCH_SIZE,
  MAX_BATCH_WAIT_TIME,
  MAX_RETRY_ATTEMPTS,
} from "../config";

/**
 * TYPE: main function
 * Fetches the mail and checks for existing mails, and calls processEmails when emails are found
 *
 * @param  {object} res
 */

async function main() {
  try {
    await _checkForLostEmails();
    const emails = await fetchEmails(MAILBOX_URI, "outbox");
    console.log(`${emails.length} Emails found that need to be sent.`);
    await _processEmails(emails, EMAIL_PROTOCOL);
  } catch (err) {
    console.error(err);
    throw `Error while processing emails: ${err}`;
  }
}

/**
 * Checks if there are emails stuck in sending box, if so and timeout has expired + lastAttempt has been set to true, move them to the failbox
 * otherwhise if timeout has expired but not lastAttempt, move email to outbox & set lastAttempt to true
 */
async function _checkForLostEmails() {
  const emails = await fetchEmails(MAILBOX_URI, "sending");

  for (const email of emails) {
    const modifiedDate = new Date(email.sentDate);
    const currentDate = new Date();
    const timeout =
      (currentDate - modifiedDate) / (1000 * 60 * 60) <= HOURS_SENDING_TIMEOUT;
    if (timeout && email.numberOfRetries >= MAX_RETRY_ATTEMPTS) {
      await moveEmailToFolder(MAILBOX_URI, email, "failbox");
      console.log(
        `Email still stuck in sending after ${MAX_RETRY_ATTEMPTS} retry attempts. Moving the email to "failbox"`
      );
      console.log(`Email URI: ${email.email}`);
    } else if (timeout) {
      await moveEmailToFolder(MAILBOX_URI, email, "outbox");
      await incrementRetryAttempt(email);

      console.log(
        "Found email stuck in sending. Will retry sending email again"
      );
      console.log(
        `Attempt ${email.numberOfRetries} out of ${MAX_RETRY_ATTEMPTS}`
      );
      console.log(`Email URI: ${email.email}`);
    }
  }
}

/**
 * TYPE: sub function
 * Function called by main when emails are found.
 * Splits emails into batches of a given number. This so to not overload the database when sending large amounts of emails in parallel. Default amount of emails in a batch is 200.
 * Checks the protocol passed in the environment variables and calls the right function or throws an error, if protocol does not exist
 *
 * @param  {object} emails
 * @param  {string} protocol
 */
async function _processEmails(emails, protocol) {
  const emailBatches = chunkEmails(emails, MAX_BATCH_SIZE);
  for (const batch of emailBatches) {
    for (const [index, email] of batch.entries()) {
      switch (protocol) {
        case "smtp":
          await sendSMTP(email, index + 1);
          break;
        case "MS_Graph_API":
          await sendMSGraphAPI(email, index + 1);
          break;
        default:
          throw new Error(
            "*** Unsupported or no protocol defined. Available options: 'smtp', 'MS_Graph_API', or 'test' ***"
          );
      }
    }
    await new Promise((resolve) => setTimeout(resolve, MAX_BATCH_WAIT_TIME));
  }
}

export default main;

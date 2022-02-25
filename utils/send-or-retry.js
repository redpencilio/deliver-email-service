import moveEmailToFolder from "../queries/move-email-to-folder";
import incrementRetryAttempt from "../queries/increment-retry-attempt";
import createLog from "../queries/create-log";
import {
  HOURS_DELIVERING_TIMEOUT,
  MAX_RETRY_ATTEMPTS,
  MAILBOX_URI,
  ERROR_LOGS_GRAPH,
  LOG_ERRORS,
} from "../config";

async function sendOrRetry(sendFunction) {
  try {
    sendFunction();
  } catch (err) {
    console.dir(err);

    const modifiedDate = new Date(email.sentDate);
    const currentDate = new Date();
    const timeout =
      (currentDate - modifiedDate) / (1000 * 60 * 60) <=
      parseInt(HOURS_DELIVERING_TIMEOUT);

    if (timeout && email.numberOfRetries >= MAX_RETRY_ATTEMPTS) {
      await moveEmailToFolder(MAILBOX_URI, email, "failbox");
      console.log(
        `Email ${count}: The destination server responded with an error.`
      );
      console.log(
        `Email ${count}: Max retries ${MAX_RETRY_ATTEMPTS} exceeded. Emails had been moved to failbox`
      );
      console.dir(`Email ${count}: ${err}`);

      if (LOG_ERRORS) {
        await createLog(ERROR_LOGS_GRAPH, email.email, `${err}`);
      }
    } else {
      await incrementRetryAttempt(email);
      await moveEmailToFolder(MAILBOX_URI, email, "outbox");
      console.log(
        `Email ${count}: The destination server responded with an error. Email set to be retried at next cronjob.`
      );
      console.log(
        `Email ${count}: Attempt ${email.numberOfRetries} out of ${MAX_RETRY_ATTEMPTS}`
      );
      console.dir(`Email ${count}: ${err}`);
    }
  }
}

export default sendOrRetry;

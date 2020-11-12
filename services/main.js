/** IMPORTS */ 
import fetchEmails  from '../queries/fetch-emails';
import moveEmailToFolder from '../queries/move-email-to-folder';
import setLastAttempt from '../queries/set-last-attempt';
import sendSMTP from './protocols/SMTP';
import sendTEST from './protocols/TEST';

/** ENV */ 
import { 
  EMAIL_PROTOCOL, 
  GRAPH, 
  URI
} from '../config';

/**
 * TYPE: main function
 * Fetches the mail and checks for existing mails, and calles processEmails when emails are found
 * 
 * @param  {object} res
 */
async function main(res) {
  try{
    await _checkForLostEmails();
    const emails = await fetchEmails(GRAPH, URI, "outbox");
    if (emails.length == 0) {
      console.log("*** No Emails found to be send. ***")
      return res.status(204).end();
    }

    console.log(` >>> ${emails.length} Emails found that need to be send. `);
    _processEmails(emails, EMAIL_PROTOCOL);
  }
  catch(err){
    console.dir(err);
  }

  return res.status(204).end();
}

/**
 * Checks if there are emails stuck in sending box, if so and timeout has expired + lastAttempt has been set to true, move them to the failbox
 * otherwhise if timeout has expired but not lastAttempt, move email to outbox & set lastAttempt to true
 */
async function _checkForLostEmails(){
  const emails = await fetchEmails(GRAPH, URI, "sending")
  
  emails.forEach(async email => {
    let modifiedDate = new Date(email.sentDate);
    let currentDate = new Date();
    let timeout = ((currentDate - modifiedDate) / (1000 * 60 * 60)) <= .4;
    if(timeout && email.lastSendingAttempt == true){
      await moveEmailToFolder(GRAPH, email, "failbox");
      console.log(' > Found email stuck in sending after retry. Moving the email to "failbox"');
      console.log(` > Email UUID: ${email.uuid}`)

    } else if (timeout){
      await moveEmailToFolder(GRAPH, email, "outbox");
      await setLastAttempt(GRAPH, email);

      console.log(' > Found email stuck in sending. Will retry sending email again');
      console.log(` > Email UUID: ${email.uuid}`)
    } 
  });                                 
}

/**
 * TYPE: sub function
 * Function called by main when emails are found. Checks the protocol passed in the environment variables and calls the right function or throws an error, if protocol does not exist
 * 
 * @param  {object} emails
 * @param  {string} protocol
 */
async function _processEmails(emails, protocol) {
    switch (protocol) {
      case "smtp":
        Promise.all(emails.map((email, index) => sendSMTP(email, index)));
        break;
      case "test":
        Promise.all(emails.map((email, index) => sendTEST(email, index)));
        break;
      default:
        throw new Error( "*** Unsupported or no protocol defined. Available options: 'smtp' or 'test' ***");
    }
  }
  
export default main;
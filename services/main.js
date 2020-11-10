/** IMPORTS */ 
import fetchEmails  from '../queries/fetch-emails';
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
        throw new Error( "*** Unsupported or no protocol defined. Available options: 'smtp' , 'rest' or 'test' ***");
    }
  }
  
export default main;
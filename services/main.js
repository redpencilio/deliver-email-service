// IMPORTS
import fetchEmails  from '../queries/fetch-emails';
import sendSMTP from './protocols/SMTP';
import sendTEST from './protocols/TEST';

// ENV
import { 
  EMAIL_PROTOCOL, 
  GRAPH, 
  URI
 } from '../config';


// MAIN FUNCTION
async function main(res) {
  try{
    const emails = await fetchEmails(GRAPH, URI);

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

// SUB FUNCTIONS
function _processEmails(emails, protocol) {
    switch (protocol) {
      case "smtp":
        sendSMTP(emails);
        break;
      case "test":
        sendTEST(emails);
        break;
      default:
        throw new Error( "*** Unsupported or no protocol defined. Available options: 'smtp' , 'rest' or 'test' ***");
    }
  }
  
export default main;
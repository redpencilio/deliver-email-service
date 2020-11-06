// IMPORTS
import fetchEmails  from '../queries/fetch-emails';
import smtp from './protocols/SMTP';
import test from './protocols/TEST';

// ENV
import { 
  EMAIL_PROTOCOL, 
  GRAPH, 
  URI
 } from '../config';

// MAIN FUNCTION
async function main(res) {
  try{
    let emails = await fetchEmails(GRAPH, URI);

    if (emails.length == 0) {
      console.log("*** No Emails found to be send. ***")
      return res.status(204).end();
    }
    console.log(` >>> ${emails.length} Emails found that need to be send. `);
    await _processEmails(emails);
  }
  catch(err){
    console.dir(err);
  }
}

  // SUB FUNCTIONS
 async function _processEmails(emails) {
    switch (EMAIL_PROTOCOL) {
      case "smtp":
        smtp(emails);
        break;
      case "rest":
        throw new Error( "*** Sending emails via 'rest' is not supported at the moment. ***");
      case "test":
        test(emails);
        break;
      default:
        throw new Error( "*** Unsupported or no protocol defined. Available options: 'smtp' , 'rest' or 'test' ***");
    }
  }
  
export default main;
// IMPORTS
import fetchEmails  from '../queries/fetchEmails';
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
    await _checkLength(emails, res);
    await _processEmails(emails);
  }
  catch(err){
    console.dir(err);
  }
}

  // SUB FUNCTIONS
  async function _checkLength(emails, res) {
    
    if (emails.length == 0) {
      throw "*** No Emails found to be send. ***" ;
    }
    console.log(` >>> ${emails.length} Emails found that need to be send. `);
  }

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
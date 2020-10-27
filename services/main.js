// IMPORTS
const { default: fetchEmails } = require('../queries/fetchEmails');
const { default: smtp } = require('./protocols/SMTP');
const { default: test } = require('./protocols/TEST');

// ENV
const graph = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';
const uri = process.env.MAILFOLDER_URI || 'http://data.lblod.info/id/mailboxes/1';
const protocol = process.env.EMAIL_PROTOCOL;

// MAIN FUNCTION
async function main(res) {
  try{
    console.log(" >>> Find & Retrieve Emails from the database.");
    let emails = await fetchEmails(graph, uri);
    await _checkLength(emails, res);

    console.log(` >>> Start sending emails`);
    _processEmails(emails);
  }
  catch(err){
    console.dir(err);
  }
}

  // SUB FUNCTIONS
  async function _checkLength(emails, res) {
    if (emails.length == 0) {
      res.status(204).end();
      throw "*** No Emails found to be send. ***" ;

    } else {
      console.log(` >  ${emails.length} emails found that need to be send. `);
    }
  }

  async function _processEmails(emails) {
    switch (protocol) {
      case "smtp":
        smtp(emails);
        break;
      case "rest":
        throw `*** Sending emails via 'rest' is not supported at the moment. ***`;
      case "test":
        test(emails);
        break;
      default:
        throw "*** Unsupported or no protocol defined. Available options: 'smtp' , 'rest' or 'test' ***";
    }
  }
  
export default main;
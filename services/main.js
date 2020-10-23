// IMPORTS
const { default: fetchEmails } = require('../queries/fetchEmails')
const { default: smtp } = require('./protocols/SMTP')

// ENV
const graph = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';
const uri = process.env.MAILFOLDER_URI || 'http://data.lblod.info/id/mailboxes/1';
const protocol = process.env.EMAIL_PROTOCOL;


// MAIN FUNCTION
async function main() {
  try{
    console.log(" >>> Find & Retrieve Emails from the database.")
    let emails = await fetchEmails(graph, uri);
    checkLength(emails)

    console.log(` >>> Start sending emails`)
    processEmails(emails);
  }
  catch(err){
    console.log(err)
  }
}


  // SUB FUNCTIONS CALLED BY MAIN FUNCTION
  function checkLength(emails) {

    if (emails.length == 0) {
      throw "*** No Emails found to be send. ***"
    } else {
      console.log(` >  ${emails.length} emails found that need to be send. `)
    }
  }

  function processEmails(emails) {

    switch (protocol) {
      case "smtp":
        smtp(emails)
        break;
      case "rest":
        throw `*** Sending emails via 'rest' is not supported at the moment. ***`;
      default:
        throw "*** Unsupported or no protocol defined.***";
    }
  }
  

export default main;
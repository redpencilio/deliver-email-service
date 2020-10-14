const { default: fetchEmails } = require('../queries/fetchEmails');


class getEmails {

  constructor(){
    this.graph = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';
    this.uri = process.env.MAILFOLDER_URI || 'http://data.lblod.info/id/mailboxes/1';
  }

  retrieveEmails(){
    let mails = fetchEmails(this.graph, this.uri)
    return mails
  }

}

export default getEmails;
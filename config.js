

// CONFIGURATION
const GRAPH = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';
const URI = process.env.MAILFOLDER_URI || 'http://data.lblod.info/id/mailboxes/1';
const EMAIL_PROTOCOL = process.env.EMAIL_PROTOCOL;
const FROM_NAME = process.env.FROM_NAME || '';
const HOURS_DELIVERING_TIMEOUT = process.env.HOURS_DELIVERING_TIMEOUT || 1;
const WELL_KNOWN_SERVICE = process.env.WELL_KNOWN_SERVICE.toLowerCase();

export {
  GRAPH,
  URI,
  EMAIL_PROTOCOL,
  FROM_NAME,
  HOURS_DELIVERING_TIMEOUT,
  WELL_KNOWN_SERVICE
}
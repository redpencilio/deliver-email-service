// IMPORTS
import nodemailerServices from '../../data/node-mailer-services';

// CONFIGURATION
const GRAPH = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';
const URI = process.env.MAILFOLDER_URI || 'http://data.lblod.info/id/mailboxes/1';
const EMAIL_PROTOCOL = process.env.EMAIL_PROTOCOL;
const FROM_NAME = process.env.FROM_NAME || '';
const HOURS_DELIVERING_TIMEOUT = process.env.HOURS_DELIVERING_TIMEOUT || 1;
const WELL_KNOWN_SERVICE = process.env.WELL_KNOWN_SERVICE.toLowerCase();

if (nodemailerServices.indexOf(WELL_KNOWN_SERVICE)  == -1) {
  throw new Error(` *** WELL_KNOWN_SERVICE should be 'smtp' or a known service by Nodemailer *** `);
};

export {
  GRAPH,
  URI,
  EMAIL_PROTOCOL,
  FROM_NAME,
  HOURS_DELIVERING_TIMEOUT,
  WELL_KNOWN_SERVICE
}

/** CONFIGURATION */ 
const GRAPH = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';
const URI = process.env.MAILFOLDER_URI || 'http://data.lblod.info/id/mailboxes/1';
const EMAIL_PROTOCOL = process.env.EMAIL_PROTOCOL;
const FROM_NAME = process.env.FROM_NAME || '';
const HOURS_DELIVERING_TIMEOUT = process.env.HOURS_DELIVERING_TIMEOUT || 1;
const HOURS_SENDING_TIMEOUT = process.env.HOURS_SENDING_TIMEOUT || .5;
const MAX_BATCH_SIZE = process.env.MAX_BATCH_SIZE || 200;
const WELL_KNOWN_SERVICE = process.env.WELL_KNOWN_SERVICE.toLowerCase();
const CRON_FREQUENCY = process.env.EMAIL_CRON_PATTERN || '* * 1 * * *';
const SECURE_CONNECTION = process.env.SECURE_CONNECTION || false;
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const HOST = process.env.HOST;
const PORT = process.env.PORT;


const nodeMailerServices = [
  '126',
  '163',
  '1und1',
  'aol',
  'debugmail',
  'dynectemail',
  'fastmail',
  'gandimail',
  'gmail',
  'godaddy',
  'godaddyasia',
  'godaddyeurope',
  'hot.ee',
  'hotmail',
  'icloud',
  'mail.ee',
  'mail.ru',
  'maildev',
  'mailgun',
  'mailjet',
  'mailosaur',
  'mandrill',
  'naver',
  'openmailbox',
  'outlook365',
  'postmark',
  'qq',
  'qqex',
  'sendcloud',
  'sendgrid',
  'sendinblue',
  'sendpulse',
  'ses',
  'ses-us-east-1',
  'ses-us-west-2',
  'ses-eu-west-1',
  'smtp',
  'sparkpost',
  'yahoo',
  'yandex',
  'zoho',
  'qiye.aliyun'
];


/**
 * Checks if service passed in environment variables is valid or throws an error early
 */
if (nodeMailerServices.indexOf(WELL_KNOWN_SERVICE)  == -1) {
  throw new Error(` *** WELL_KNOWN_SERVICE should be 'smtp' or a known service by Nodemailer *** `);
};


/** EXPORTS */ 
export {
  GRAPH,
  URI,
  EMAIL_PROTOCOL,
  FROM_NAME,
  HOURS_DELIVERING_TIMEOUT,
  HOURS_SENDING_TIMEOUT,
  MAX_BATCH_SIZE,
  WELL_KNOWN_SERVICE,
  CRON_FREQUENCY,
  SECURE_CONNECTION,
  EMAIL_ADDRESS,
  EMAIL_PASSWORD,
  HOST,
  PORT,
  nodeMailerServices
}
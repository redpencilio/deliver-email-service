const MAILBOX_URI = process.env.MAILBOX_URI;
const EMAIL_PROTOCOL = process.env.EMAIL_PROTOCOL || 'smtp';
const FROM_NAME = process.env.FROM_NAME || '';
const HOURS_DELIVERING_TIMEOUT = process.env.HOURS_DELIVERING_TIMEOUT || 1;
const HOURS_SENDING_TIMEOUT = process.env.HOURS_SENDING_TIMEOUT || .5;
const MAX_BATCH_SIZE = process.env.MAX_BATCH_SIZE || 10;
const MAX_RETRY_ATTEMPTS = process.env.MAX_RETRY_ATTEMPTS || 5;
const WELL_KNOWN_SERVICE = (process.env.WELL_KNOWN_SERVICE || '').toLowerCase();
const CRON_FREQUENCY = process.env.EMAIL_CRON_PATTERN || '* * 1 * * *';
const SECURE_CONNECTION = process.env.SECURE_CONNECTION == "true" || false;
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const LOG_ERRORS = process.env.LOG_ERRORS || false;
const LOGS_GRAPH = process.env.LOGS_GRAPH || "http://mu.semte.ch/graphs/public";
const HOST = process.env.HOST;
const PORT = process.env.PORT;

if(!MAILBOX_URI){
  throw `Expected a MAILBOX_URI`;
}

const NODE_MAILER_SERVICES = [
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
  'qiye.aliyun',
  'test'
];

export {
  MAILBOX_URI,
  EMAIL_PROTOCOL,
  FROM_NAME,
  HOURS_DELIVERING_TIMEOUT,
  HOURS_SENDING_TIMEOUT,
  MAX_BATCH_SIZE,
  MAX_RETRY_ATTEMPTS,
  WELL_KNOWN_SERVICE,
  CRON_FREQUENCY,
  SECURE_CONNECTION,
  EMAIL_ADDRESS,
  EMAIL_PASSWORD,
  LOG_ERRORS,
  LOGS_GRAPH,
  HOST,
  PORT,
  NODE_MAILER_SERVICES
};

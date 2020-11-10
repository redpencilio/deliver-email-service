/** IMPORTS */
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri } from 'mu';
import sortResults from '../utils/sort-results';

/**
 * TYPE: query
 * Fetches all mails in the outbox folder. 
 * @param  {string} graphName
 * @param  {string} mailboxURI
 * @param  {string} folderName
 * @returns Array of emails 
 */
async function fetchEmails(graphName, mailboxURI, folderName) {
  const result = await query(`
  PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
  PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
  PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext#>

  SELECT ?email
    ?uuid
    ?messageSubject
    ?messageFrom
    (group_concat(distinct ?emailTo;separator=",") as ?emailTo)
    (group_concat(distinct ?emailCc;separator=",") as ?emailCc)
    (group_concat(distinct ?emailBcc;separator=",") as ?emailBcc)
    ?messageId
    ?plainTextMessageContent
    ?htmlMessageContent
    ?sentDate
    ?lastSendingAttempt
    ?attachments

  WHERE {
    GRAPH ${sparqlEscapeUri(graphName)} {
      ${sparqlEscapeUri(mailboxURI)} fni:hasPart ?mailfolder.
      ?mailfolder nie:title "${folderName}".
      ?email nmo:isPartOf ?mailfolder.
      ?email <http://mu.semte.ch/vocabularies/core/uuid> ?uuid.
      ?email nmo:messageSubject ?messageSubject.
      ?email nmo:messageFrom ?messageFrom.
      ?email nmo:emailTo ?emailTo.
      ?email nmo:hasAttachment ?attachments

      BIND(false as ?defaultSA).
      OPTIONAL {?email ext:lastSendingAttempt ?optionalSA}.
      BIND(coalesce(?optionalSA, ?defaultSA) as ?lastSendingAttempt).

      BIND('' as ?defaultEmailCc).
      OPTIONAL {?email nmo:emailCc ?optionalEmailCc}.
      BIND(coalesce(?optionalEmailCc, ?defaultEmailCc) as ?emailCc).

      BIND('' as ?defaultEmailBcc).
      OPTIONAL {?email nmo:emailBcc ?optionalEmailBcc}.
      BIND(coalesce(?optionalEmailBcc, ?defaultEmailBcc) as ?emailBcc).

      BIND('' as ?defaultmessageId).
      OPTIONAL {?email nmo:messageId ?optionalMessageId}.
      BIND(coalesce(?optionalMessageId, ?defaultmessageId) as ?messageId).

      BIND('' as ?defaultPlainTextMessageContent).
      OPTIONAL {?email nmo:plainTextMessageContent ?optionalPlainTextMessageContent}.
      BIND(coalesce(?optionalPlainTextMessageContent, ?defaultPlainTextMessageContent) as ?plainTextMessageContent).

      BIND('' as ?defaultHtmlMessageContent).
      OPTIONAL {?email nmo:htmlMessageContent ?optionalHtmlMessageContent}.
      BIND(coalesce(?optionalHtmlMessageContent, ?defaultHtmlMessageContent) as ?htmlMessageContent).

      BIND('' as ?defaultSentDate).
      OPTIONAL {?email nmo:sentDate ?optionalSentDate}.
      BIND(coalesce(?optionalSentDate, ?defaultSentDate) as ?sentDate).
    }
  }
  GROUP BY ?email ?uuid ?messageSubject ?messageFrom ?messageId ?plainTextMessageContent ?htmlMessageContent ?sentDate ?lastSendingAttempt ?attachments
`);
  return sortResults(result);
};

export default fetchEmails;
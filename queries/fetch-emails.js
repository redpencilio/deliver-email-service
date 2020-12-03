/** IMPORTS */
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri, sparqlEscapeInt } from 'mu';
import parseResults from '../utils/parse-results';

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
  PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>

  SELECT ?email
    ?messageSubject
    ?messageFrom
    (group_concat(distinct ?emailTo;separator=",") as ?emailTo)
    (group_concat(distinct ?emailCc;separator=",") as ?emailCc)
    (group_concat(distinct ?emailBcc;separator=",") as ?emailBcc)
    ?messageId
    ?plainTextMessageContent
    ?htmlMessageContent
    ?sentDate
    ?numberOfRetries
    ?attachments

  WHERE {
    GRAPH ${sparqlEscapeUri(graphName)} {
      ${sparqlEscapeUri(mailboxURI)} fni:hasPart ?mailfolder.
      ?mailfolder nie:title "${folderName}".
      ?email nmo:isPartOf ?mailfolder.
      ?email nmo:messageSubject ?messageSubject.
      ?email nmo:messageFrom ?messageFrom.
      ?email nmo:emailTo ?emailTo.

      BIND('' as ?defaultAttachments).
      OPTIONAL {?email nmo:hasAttachment ?optionalAttachments}.
      BIND(coalesce(?optionalAttachments, ?defaultAttachments) as ?attachments).

      BIND(${sparqlEscapeInt(0)} as ?defaultRetries).
      OPTIONAL {?email task:numberOfRetries ?optionalRetries}.
      BIND(coalesce(?optionalRetries, ?defaultRetries) as ?numberOfRetries).

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
  GROUP BY ?email ?messageSubject ?messageFrom ?messageId ?plainTextMessageContent ?htmlMessageContent ?sentDate ?attachments ?numberOfRetries
`);
  return parseResults(result);
};

export default fetchEmails;

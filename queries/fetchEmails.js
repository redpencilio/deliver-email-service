import { querySudo as query } from '@lblod/mu-auth-sudo';
import { app, sparqlEscapeString, sparqlEscapeUri } from 'mu';
import parseResults from '../utils/parseResults';

async function fetchEmails(graphName, mailfolderUri) {
  const result = await query(`
  PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
  PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
  PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>

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
  WHERE {
    GRAPH ${sparqlEscapeUri(graphName)} {
      ${sparqlEscapeUri(mailfolderUri)} fni:hasPart ?mailfolder.
      ?mailfolder nie:title "outbox".
      ?email nmo:isPartOf ?mailfolder.
      ?email <http://mu.semte.ch/vocabularies/core/uuid> ?uuid.
      ?email nmo:messageSubject ?messageSubject.
      ?email nmo:messageFrom ?messageFrom.
      ?email nmo:emailTo ?emailTo.

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
  GROUP BY ?email ?uuid ?messageSubject ?messageFrom ?messageId ?plainTextMessageContent ?htmlMessageContent ?sentDate
`);

  return parseResults(result);
};

export default fetchEmails;
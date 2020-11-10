/** IMPORTS */
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeString, sparqlEscapeUri } from 'mu';

/**
 * TYPE: query
 * Removes and adds emails to a different mailfolder.
 * e.g. from outbox folder to sending folder
 * @param  {string} graphName
 * @param  {string} email
 * @param  {string} mailboxName
 */
async function moveEmailToFolder(graphName, email, mailboxName) {
    const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>
    PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>

    DELETE {
      GRAPH ${sparqlEscapeUri(graphName)} {
            ?email nmo:isPartOf ?folder.
        }
      }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
            ?email nmo:isPartOf ?folder.
            BIND('${email.email}' as ?email).
        }
    }
    ;
    INSERT {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ?email nmo:isPartOf ?mailfolder.
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
            ?mailfolder a nfo:Folder.
            ?mailfolder nie:title  ${sparqlEscapeString(mailboxName)}.
            ?email a nmo:Email.
            BIND ('${email.email}' as ?email).
        }
    }
  `);
  return result
};

export default moveEmailToFolder
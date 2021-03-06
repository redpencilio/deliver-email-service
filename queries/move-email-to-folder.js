/** IMPORTS */
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeString, sparqlEscapeUri } from 'mu';

/**
 * TYPE: query
 * Removes and adds emails to a different mailfolder.
 * e.g. from outbox folder to sending folder
 * @param  {string} email
 * @param  {string} folderName
 * @param  {string} mailboxUri
 */
async function moveEmailToFolder(mailboxUri, email, folderName) {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>

    DELETE {
      GRAPH ?g {
            ${sparqlEscapeUri(email.email)}  nmo:isPartOf ?oldFolder.
        }
    }
    INSERT {
      GRAPH ?g {
            ${sparqlEscapeUri(email.email)} nmo:isPartOf ?newFolder.
        }
    }
    WHERE {
      GRAPH ?g {
            ${sparqlEscapeUri(email.email)} nmo:isPartOf ?oldFolder.
            ${sparqlEscapeUri(mailboxUri)} nie:hasPart ?newFolder.
            ?newFolder nie:title ${sparqlEscapeString(folderName)}.
        }
    }
  `);
  return result;
};

export default moveEmailToFolder;

/** IMPORTS */
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeString, sparqlEscapeUri } from 'mu';

/**
 * TYPE: query
 * Updates messageID.
 * Happends when e-mail has successfully been send and server returns new unique messageID
 * @param  {object} email
 * @param  {string} newMessageId
 */
export default async function updateEmailId(email, newMessageId) {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>

    DELETE {
      GRAPH ?g {
          ?email nmo:messageId ?oldMessageId.
        }
      }
    INSERT {
      GRAPH ?g {
          ?email nmo:messageId ${sparqlEscapeString(newMessageId)}.
        }
    }
    WHERE {
      GRAPH ?g {
          BIND(${sparqlEscapeUri(email.email)} as ?email)
          ?email a nmo:Email.
          OPTIONAL { ?email nmo:messageId ?oldMessageId. }
        }
    }
  `);

  return result;
};

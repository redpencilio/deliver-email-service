/** IMPORTS */
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri, sparqlEscapeBool } from 'mu';

/**
 * TYPE: query
 * Adds property lastSendingAttempt: true, to email.
 * Happends when email has failed sending and timeout has not exceeded yet so it gets placed in the outbox again for later retry
 * @param  {string} graphName
 * @param  {object} email
 */
async function setLastAttempt(graphName, email) {
    const result = await query(`
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext#>

    DELETE {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} ext:lastSendingAttempt ?lastSendingAttempt.
        }
      }
    INSERT {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} ext:lastSendingAttempt ${sparqlEscapeBool("1")}.
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} ext:lastSendingAttempt ?lastSendingAttempt.
        }
    }
  `);
  return result
};

export default setLastAttempt
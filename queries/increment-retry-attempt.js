/** IMPORTS */
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri, sparqlEscapeInt } from 'mu';

/**
 * TYPE: query
 * increments the number of task:numberOfRetries by one
 * Happends when email has failed sending and timeout has not exceeded yet so it gets placed in the outbox again for later retry
 * @param  {string} graphName
 * @param  {object} email
 */
async function incrementRetryAttempt(graphName, email) {

    const incrementedAttempt = parseInt(email.numberOfRetries) + 1

    const result = await query(`
    PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>

    DELETE {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} task:numberOfRetries ?numberOfRetries.
        }
      }
    INSERT {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} task:numberOfRetries ${sparqlEscapeInt(incrementedAttempt)}.
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} task:numberOfRetries ?numberOfRetries.
        }
    }
  `);
  return result
};

export default incrementRetryAttempt
/** IMPORTS */
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri, sparqlEscapeInt } from 'mu';

/**
 * TYPE: query
 * increments the number of task:numberOfRetries by one
 * Happends when email has failed sending and timeout has not exceeded yet so it gets placed in the outbox again for later retry
 * @param  {object} email
 */
async function incrementRetryAttempt(email) {

  const incrementedAttempt = parseInt(email.numberOfRetries || 0) + 1;

  const result = await query(`
    PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>

    DELETE {
      GRAPH ?g {
          ?email task:numberOfRetries ?numberOfRetries.
        }
      }
    INSERT {
      GRAPH ?g {
          ?email task:numberOfRetries ${sparqlEscapeInt(incrementedAttempt)}.
        }
    }
    WHERE {
      GRAPH ?g {
          BIND(${sparqlEscapeUri(email.email)} as ?email)
          ?email a nmo:Email.
          OPTIONAL { ?email task:numberOfRetries ?numberOfRetries. }
        }
    }
  `);

  return result;
};

export default incrementRetryAttempt;

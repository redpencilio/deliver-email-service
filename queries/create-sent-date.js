/** IMPORTS */
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri, sparqlEscapeDateTime } from 'mu';

/**
 * TYPE: query
 * Removes old sentDate & creates a new one using current time
 * @param  {string} graphName
 * @param  {object} email
 */
async function createSentDate(graphName, email) {
  const sentDate = new Date().toISOString();
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>

    DELETE {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} nmo:sentDate ?sentDate.
      }
    }

    INSERT {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} nmo:sentDate ${sparqlEscapeDateTime(sentDate)}.
        }
    }

    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} nmo:sentDate ?sentDate.
        }
    }
  `);

  return result
}

export default createSentDate;
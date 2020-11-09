import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeString, sparqlEscapeUri } from 'mu';

export default async function updateEmailId(graphName, email, newMessageId) {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>

    DELETE {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} nmo:messageId ?oldMessageId.
        }
      }
    INSERT {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} nmo:messageId ${sparqlEscapeString(newMessageId)}.
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
          ${sparqlEscapeUri(email.email)} nmo:messageId ?oldMessageId.
        }
    }
`);

return result
};

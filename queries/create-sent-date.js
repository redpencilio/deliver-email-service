import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri, sparqlEscapeDateTime } from 'mu';


async function createSentDate(graphName, email) {
  const sentDate = new Date().toISOString();
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>

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
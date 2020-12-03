/** IMPORTS */
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri, sparqlEscapeDateTime } from 'mu';

/**
 * TYPE: query
 * Updates sent date
 * @param  {object} email
 */
async function updateSentDate(email) {
  const sentDate = new Date().toISOString();
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>

    DELETE {
      GRAPH ?g {
          ?email nmo:sentDate ?sentDate.
      }
    }

    INSERT {
      GRAPH ?g {
          ?email nmo:sentDate ${sparqlEscapeDateTime(sentDate)}.
        }
    }

    WHERE {
      GRAPH ?g {
          BIND(${sparqlEscapeUri(email.email)} as ?email)
          ?email a nmo:Email.
          OPTIONAL { ?email nmo:sentDate ?sentDate. }
        }
    }
  `);

  return result;
}

export default updateSentDate;

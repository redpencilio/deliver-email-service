export default async function createSentDate(graphName, email) {
  const sentDate = new Date().toISOString();
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>

    INSERT {
       GRAPH ${sparqlEscapeUri(graphName)} {
           ?email nmo:sentDate "${sentDate}".
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
            ?email a nmo:Email.
            ?email <http://mu.semte.ch/vocabularies/core/uuid> "${email.uuid}".
        }
    }
  `);
  email.sentDate = sentDate;
}
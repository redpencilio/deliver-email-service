export default async function updateEmailId(graphName, oldMessageId, newMessageId) {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>

    DELETE {
       GRAPH ${sparqlEscapeUri(graphName)} {
            ?email nmo:messageId ${sparqlEscapeString(oldMessageId)}.
        }
     }
    INSERT {
       GRAPH ${sparqlEscapeUri(graphName)} {
           ?email nmo:messageId ${sparqlEscapeString(newMessageId)}.
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
            ?email a nmo:Email.
            ?email nmo:messageId ${sparqlEscapeString(oldMessageId)}.
        }
    }
`);
};
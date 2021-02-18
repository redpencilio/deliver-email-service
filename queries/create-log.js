/** IMPORTS */
import { updateSudo as update } from '@lblod/mu-auth-sudo';
import { sparqlEscapeString, sparqlEscapeUri, sparqlEscapeDateTime, uuid } from 'mu';

/**
 * TYPE: query
 * Save error log to database
 * Happends when a send a send mail does not arrive and returns an error
 * @param  {string} logsGraph
 * @param  {string} errorMessage
 */
export default async function createLog(logsGraph, source, errorMessage) {
  const logEntryUuid = uuid();
  const logEntryUri = "http:///mu.semte.ch/vocabularies/log-entries/".concat(logEntryUuid);

  const result = await update(`
    PREFIX rlog: <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/rlog#>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    INSERT DATA {
        GRAPH ${sparqlEscapeUri(logsGraph)} {
          ${sparqlEscapeUri(logEntryUri)} a rlog:Entry ;
            <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(logEntryUuid)} ;
            dct:source ${sparqlEscapeUri(source)} ;
            rlog:message ${sparqlEscapeString(errorMessage)} ;
            rlog:date ${sparqlEscapeDateTime(new Date)}.
        }
    }
  `);

  debugger;

  return result
}

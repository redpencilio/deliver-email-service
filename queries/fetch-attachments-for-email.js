import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri } from 'mu';
import parseResults from '../utils/parse-results';

/**
 * Given emailUri return a list of attachments
 * TODO: there is no check, if an attachment is specified, but no further data is found
 * @param  {string} emailUri
 * @returns [ { attachment } ]
 */
export default async function fetchAttachmentsForEmail(emailUri){
  const queryStr = `
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>

    SELECT DISTINCT ?physicalFile ?filename ?attachment ?email
    WHERE {
       BIND(${sparqlEscapeUri(emailUri)} as ?email)
       ?email nmo:hasAttachment ?attachment.

      GRAPH ?g {
        ?attachment a nfo:FileDataObject.
        OPTIONAL { ?attachment nfo:fileName ?filename. }
        ?physicalFile nie:dataSource ?attachment.
      }
    }
  `;

  const attachmentsData = parseResults(await query(queryStr));

  //Some extra mapping is needed to map the URI to a file path in this container.
  // share:// is kinda a semantic.works convention
  attachmentsData.forEach(attachment => {
    attachment.path = attachment.physicalFile.replace('share://', '/share/');
  });

  return attachmentsData;

}

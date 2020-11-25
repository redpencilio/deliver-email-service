const chunkEmails = function(emails, chunkSize) {
  let chunkedArray = []
    for (var i = 0; i < emails.length; i += chunkSize)
      chunkedArray.push(emails.slice(i, i + chunkSize));
      debugger;
    return chunkedArray;
  };

  export default chunkEmails
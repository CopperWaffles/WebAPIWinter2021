//app is entry point of application
var http = require('http');

http.createServer(function(request, response)
{
    var url = request.url;
    //http header
    response.writeHead(200,{'Content-type':'text/plain'})
    //send a response
    response.end("url requested\n" + url );
}).listen(3000)

console.log("server is running on port 3000")

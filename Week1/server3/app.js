//app is entry point of application
var http = require('http');
var url = require('url')

http.createServer(function(request, response)
{
    var pathName = url.parse(request.url).pathname
    //http header
    response.writeHead(200,{'Content-type':'text/html'})

    response.write('<!DOCTYPE><html><body><div>Request for' + pathName + ' received</div></body</html>')
    //send a response
    response.end();
}).listen(3000)

console.log("server is running on port 3000")

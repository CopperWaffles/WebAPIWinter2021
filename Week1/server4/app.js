//app is entry point of application
var http = require('http');
var url = require('url');
var fileSystem = require('fs');

http.createServer(function(request, response)
{
    var pathName = url.parse(request.url).pathname
    var fileName = "index.html"

    fileSystem.readFile(fileName,callback)

    function callback(err, data)
    {
        if(err)
        {
            console.log(err)
            response.writeHead(400, {'Content-Type':'text/html'})
            response.write('<!DOCTYPE><html><body><div>Page Not Found</div></body</html>')
        }
        else
        {
            //file is present
            response.writeHead(200,{'Content-type':'text/html'})
            response.write(data.toString())
        }
        response.end()
    }
   
}).listen(3000)

console.log("server is running on port 3000")

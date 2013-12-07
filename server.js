var http = require("http"),
url = require("url"),
path = require("path"),
fs = require("fs");
port = 8888;
 
http.createServer(function(request, response) {
	//get the pathname 
	var uri = url.parse(request.url).pathname;
	//get the full path on the filesystem
	var filename = path.join(process.cwd(), uri);
	fs.exists(filename, function(exists) {
		//if the file dosent exists responde with 404
		if(!exists) {
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write("404 Not Found\n");
			response.end();
			return;
		}
		//if calling a directory add /index.html
		if (fs.statSync(filename).isDirectory()){
			filename += '/index.html';
		}
		//if the file exists read it
		fs.readFile(filename, "binary", function(err, file) {
			//if there is a error with that file return 500
			if(err) {
				//chrome is picky on XSS
				response.setHeader("Access-Control-Allow-Origin", "*");
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(err + "\n");
				response.end();
				return;
			}
			//else send the file
			//chrome is picky on XSS
			response.setHeader("Access-Control-Allow-Origin", "*");
			response.writeHead(200);
			response.write(file, "binary");
			response.end();
		});
	});
}).listen(port);
 
console.log("Ich laufe auf http://localhost:" + port + "/");
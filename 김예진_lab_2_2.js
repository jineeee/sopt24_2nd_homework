const http = require('http');
const request = require('request');
const fs = require('fs');
const json2csv = require('json2csv');

const server = http.createServer((req,res)=>{
    const option = {
        url: "http://15.164.75.18:3000/homework/2nd",
        method: "GET"
    };

    request(option, (err, response, body)=> {
        let data = {
            "msg" : "",
            "resData" : null,
            "csv" : null
        };

        if (err) {
            data.msg = "request error";
            res.writeHead(500, {'Content-type' : "text/plain"});
            res.end(JSON.stringify(data));
        } else {
            const resData = JSON.parse(body).data;
            data.resData = resData;

            const csv = json2csv.parse({
                data : resData,
                fields : ["time"]
            });
            data.csv = csv;

            fs.writeFile('info.csv', csv, (err)=>{
                if(err){
                    data.msg = "file writing error";
                    res.writeHead(500, {'Content-type' : "text/plain"});
                    res.end(JSON.stringify(data));
                } else{
                    data.msg = "sucess everything";
                    res.writeHead(200, {'Content-type' : "text/plain"});
                    res.end(JSON.stringify(data));
                }
            })
        }
    });
}).listen(3000, () => {
    console.log("connected 3000 port");
});
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');

const server = http.createServer((req,res) => {

    const urlParsed = url.parse(req.url);
    console.log(urlParsed);
    const queryParsed = querystring.parse(urlParsed.query);
    console.log(queryParsed);
    const str = queryParsed.str;
    console.log(str);
    const data = {
        "msg" : "",
        "hashed" : null
    };

    crypto.randomBytes(32, (err, buf) => {
        if(err){
            data.msg = "randomBytes 에러 발생";
            res.writeHead(500, {'Content-Type' : 'application/json'});
            res.write(JSON.stringify(data));
            res.end();
        } else {
            const salt = buf.toString('base64');
            console.log(salt);
            crypto.pbkdf2(str, salt, 10, 32, 'SHA512', (err, hashed)=>{
                if(err){
                    data.msg = "pbkdf2 에러";
                    res.writeHead(500, {'Content-Type' : 'application/json'});
                    res.write(JSON.stringify(data));
                    res.end();
                }else{
                    data.msg = "암호화 성공"
                    data.hashed = hashed.toString('base64');
                    console.log('hashedStr: ${hashedStr}');
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify(data));
                    res.end();
                }
            })
        }
    }
    )

}).listen(3000,()=>{
    console.log("3000 포트로 연결");
});
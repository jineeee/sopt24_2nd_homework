var http = require('http');
var fs = require('fs');
var url = require('url');
var crypto = require('crypto');
var querystring = require('querystring');
var json2csv = require('json2csv');
var csv = require('csvtojson');
var request = require('request');

var server = http.createServer((req,res) => {
    var parsedUrl = url.parse(req.url); // 요청으로 들어온 url을 url객체로 parsing하여 parsedUrl에 넣어줌
    var pathName = parsedUrl.pathname; // parsing된 url의 pathname을 pathname 변수에 넣어줌
    var parsedQuery = querystring.parse(parsedUrl.query); // url 객체의 query 부분을 JSON 객체 형태로 parsing
    var id = parsedQuery.id; // query 부분을 parsing한 JOSN 객체에서 필요한 부분만 새로운 변수에 넣어줌
    var pw = parsedQuery.pw;
    console.log(id, pw)
    
    if(pathName == '/signin'){ // pathName이 '/signin'으로 들어왔을 때 실행
        crypto.randomBytes(64, function(err, buf) { // 랜덤 salt값 생성
            if (err) { // 랜덤 salt값 생성 실패시 실행
                res.writeHead(500, {'Content-Type': "text/plain"});
                res.end('randomBytes error');
            } else {
                var salt = buf.toString('base64');
                crypto.pbkdf2(pw, salt, 1000, 64, 'sha512', (err, hashed) => {
                    if (err) {
                        res.writeHead(500, {'Content-Type':'text/plain'});
                        res.end('pbkdf2 error');
                    } else {
                        var hashedPw = hashed.toString('base64');
                        var csv = json2csv.parse({ // id와 hash된 비밀번호와 salt 값을 csv객체로 만들어줌
                            'id' : id,
                            'hashedPw' : hashedPw,
                            'salt' : salt
                        });
                        fs.writeFile('Data.csv', csv, (err) => { // 만든 csv객체를 이용해 파일로 저장
                            if (err) {
                                res.writeHead(500, { 'Content-Type': "text/plain" });
                                res.end("file saving error");
                            } else { // signin 작업 최종 성공
                                res.writeHead(200, { 'Content-Type': "text/plain" });
                                res.end("signin success!!");
                            }
                        });
                    }
                });
            }
        });
    }else if(pathName == '/signup'){ // pathName이 '/signup'으로 들어왔을 때 실행
        csv().fromFile('Data.csv', (err) => { // 'Data.csv'파일을 읽어와서 json객체로 변환
            if (err) {
                res.writeHead(500, { 'Content-Type': "text/plain" });
                res.end("file reading error");
            }
        })
        .then((jsonObj) => { 
            var salt = jsonObj[0].salt; // 파일에서 읽어온 내용으로 salt값을 구함
            console.log(salt);
            console.log(jsonObj);
            crypto.pbkdf2(pw, salt, 1000, 64, 'sha512', (err, hashed) => {
                if (err) {
                    res.writeHead(500, {'Content-Type':'text/plain'});
                    res.end('pbkdf2 error');
                } else {
                    var hashedPw = hashed.toString('base64');
                    console.log(jsonObj[0].hashedPw);
                    console.log(hashedPw);
                    if (hashedPw == jsonObj[0].hashedPw) { // hash된 패스워드가 파일에서 읽어온 hash된 패스워드 값과 같다면 실행
                        res.writeHead(200, { 'Content-Type': "text/plain" });
                        res.end("signup success!!");
                    } else {
                        res.writeHead(500, { 'Content-Type': "text/plain" });
                        res.end("signup fail. wrong password!");
                    }
                }
            });
        });
    }else if (pathName == '/info'){ // pathName이 '/info'로 들어왔을 때 실행
        const options = { //응답을 보낼 때의 옵션을 지정
            uri: 'http://15.164.75.18:3000/homework/2nd',
            method: 'POST',
            form : {
                name : '김예진',
                phone : '010-4699-6931'
            }
        };
        request(options, (err, response, body) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': "text/plain" });
                res.end("request error");
            } else {
                var parsedBody = JSON.parse(body); // 요청을 받은 서버의 응답으로 온 JSON객체를 파싱
                var status = parsedBody.status; // 필요한 데이터들을 뽑아 데이터에 할당
                if (status == 400){ // form으로 보낸 정보와 일치하는 회원이 없을 시 실행
                    res.writeHead(500, { 'Content-Type': "text/plain" });
                    res.end('no matching member');
                } else if (status == 200){ // form으로 보낸 정보와 일치하는 회원을 찾으면 실행
                    var parsedBodyData = parsedBody.data;
                    console.log(parsedBodyData);
                    var phone = parsedBodyData.phone;
                    crypto.randomBytes(32, (err, buf) => { // 전화번호 hash 수행
                        if(err){
                            res.writeHead(500, {'Content-type' : 'text/plain'});
                            res.end('randomBytes error');
                        } else {
                            var salt = buf.toString('base64'); 
                            var hashedPhone = crypto.createHash('sha1').update(phone).digest('hex');
                            var csv = json2csv.parse({ // hash된 전화번호와 그 외 정보들을 csv객체로 만들어줌
                                'name' : parsedBodyData.name,
                                'hashedPhone' : hashedPhone,
                                'colleage' : parsedBodyData.colleage,
                                'major' : parsedBodyData.major,
                                'email' : parsedBodyData.email
                            });
                            fs.writeFile('Member.csv', csv, (err) => { // 만든 csv객체를 이용해 파일로 저장
                                if (err) {
                                    res.writeHead(500, { 'Content-Type': "text/plain" });
                                    res.end("file saving error");
                                } else {
                                    res.writeHead(200, { 'Content-Type': "text/plain" });
                                    res.end("found matching member and member file saving success!!");
                                }
                            });
                        }
                    })
                }
            }
        })
    }else{ // 지정해놓은 pathName이외의 주소들이 들어올시 실행
        res.writeHead(404, { 'Content-Type':'text/plain' });
        res.end('404 Page Not Found');
    }
}).listen(3000, ()=>{
    console.log('Server is running!')
});
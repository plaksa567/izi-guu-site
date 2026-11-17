// Local preview of the static site.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif'};
const port=Number(process.env.PORT||4175);
createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path==='/'?'index.html':path.slice(1);
    const ext=file.split('.').pop();
    if(!Object.hasOwn(types,ext)||!(/^[\w-]+2\.(html|js|css)$/.test(file)||['index.html','edition3.css','account3.js'].includes(file)||/^vendor\/leaflet\/(?:images\/)?[\w.-]+$/.test(file)||/^images\/(?:[\p{L}\p{N}_-]+\/)*[\p{L}\p{N}_ .-]+$/u.test(file)))throw Error();
    const data=await readFile(new URL('./'+file,import.meta.url));
    res.writeHead(200,{'Content-Type':types[ext]});res.end(data);
  }catch{res.writeHead(404);res.end();}
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port+'/'));

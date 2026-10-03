// Serves ../models/*.glb|png|json on http://localhost:8765 with CORS so the Pascal editor can load the custom furniture.
// usage: node scripts/serve-models.cjs [port]
const http=require('http'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','models'), port=+process.argv[2]||8765;
const types={'.glb':'model/gltf-binary','.png':'image/png','.json':'application/json'};
http.createServer((req,res)=>{
  const f=path.join(dir,path.basename(decodeURIComponent(req.url.split('?')[0])));
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS'); res.setHeader('Cross-Origin-Resource-Policy','cross-origin');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  if(!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end('not found');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`models on http://localhost:${port}`));

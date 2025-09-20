import https from 'https';
const keys = [
  "TEST_API_KEY:076b99c4a4d7d49a8f31e566616a72dd:6f123a90e3511ea0ae54ffabd9e7e9e3",
  "TEST_API_KEY:f38bc9dbff3cb86e6a370a165cb410c7:c95df4512116abe6e747930f3ca1376d",
  "TEST_API_KEY:46b7b6c01a71d4f6cffd62ed00c2424e:80678c6a953b4ed5f8440acb6e1a4683",
];
const base = 'https://api.circle.com/v1/w3s';   // W3S base (test vs prod is in the key prefix)
const mask = k => k.slice(0,12)+'…'+k.slice(-6);

function get(path, key){return new Promise(res=>{
  const req = https.request(base+path, {method:'GET', headers:{Authorization:'Bearer '+key}}, r=>{
    let b=''; r.on('data',d=>b+=d); r.on('end',()=>res({status:r.statusCode, body:b}));
  });
  req.on('error',e=>res({status:0, body:String(e)}));
  req.end();
});}

for (const k of keys){
  // a cheap, auth-required W3S endpoint that doesn't mutate state
  // public key is good too, but /wallets proves auth scope
  // eslint-disable-next-line no-await-in-loop
  const r = await get('/wallets', k);
  console.log(mask(k),'->', r.status, (r.body||'').slice(0,220));
}






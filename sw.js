// Service worker của Sổ tay HSK: dùng offline, vẫn cập nhật khi có mạng
const V='sotay-v1',CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||!/^https?:$/.test(u.protocol))return;
  if(u.hostname.endsWith('supabase.co'))return; // dữ liệu tài khoản luôn lấy trực tiếp
  const same=u.origin===self.location.origin;
  if(same&&(r.mode==='navigate'||u.pathname.endsWith('/index.html'))){
    // trang chính: ưu tiên bản mới, mất mạng thì dùng bản đã lưu
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put('./index.html',cp));return res}).catch(()=>caches.match('./index.html').then(m=>m||caches.match('./'))));
    return;
  }
  // thư viện, font, ảnh: dùng bản đã lưu ngay, đồng thời cập nhật nền
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>m);
    return m||net;
  }));
});

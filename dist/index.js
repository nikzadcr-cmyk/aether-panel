var wt=(t,e,r)=>(n,s)=>{let a=-1;return o(0);async function o(i){if(i<=a)throw new Error("next() called multiple times");a=i;let c,l=!1,d;if(t[i]?(d=t[i][0][0],n.req.routeIndex=i):d=i===t.length&&s||void 0,d)try{c=await d(n,()=>o(i+1))}catch(u){if(u instanceof Error&&e)n.error=u,c=await e(u,n),l=!0;else throw u}else n.finalized===!1&&r&&(c=await r(n));return c&&(n.finalized===!1||l)&&(n.res=c),n}};var Kt=Symbol();var Jt=(t,e)=>new Response(t,{headers:{"Content-Type":e.replace(/^[^;]+/,n=>n.toLowerCase())}}).formData();var st=t=>"headers"in t,Qt=async(t,e=Object.create(null))=>{let{all:r=!1,dot:n=!1}=e,o=(st(t)?t.headers:t.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();return o==="multipart/form-data"||o==="application/x-www-form-urlencoded"?ir(t,{all:r,dot:n}):{}};async function ir(t,e){if(!st(t)&&t.bodyCache.formData)return Yt(await t.bodyCache.formData,e);let r=st(t)?t.headers:t.raw.headers,n=await t.arrayBuffer(),s=Jt(n,r.get("Content-Type")||"");st(t)||(t.bodyCache.formData=s);let a=await s;return a?Yt(a,e):{}}function Yt(t,e){let r=Object.create(null);return t.forEach((n,s)=>{e.all||s.endsWith("[]")?cr(r,s,n):r[s]=n}),e.dot&&Object.entries(r).forEach(([n,s])=>{n.includes(".")&&(lr(r,n,s),delete r[n])}),r}var cr=(t,e,r)=>{t[e]!==void 0?Array.isArray(t[e])?t[e].push(r):t[e]=[t[e],r]:e.endsWith("[]")?t[e]=[r]:t[e]=r},lr=(t,e,r)=>{if(/(?:^|\.)__proto__\./.test(e))return;let n=t,s=e.split(".");s.forEach((a,o)=>{o===s.length-1?n[a]=r:((!n[a]||typeof n[a]!="object"||Array.isArray(n[a])||n[a]instanceof File)&&(n[a]=Object.create(null)),n=n[a])})};var Et=t=>{let e=t.split("/");return e[0]===""&&e.shift(),e},Xt=t=>{let{groups:e,path:r}=dr(t),n=Et(r);return ur(n,e)},dr=t=>{let e=[];return t=t.replace(/\{[^}]+\}/g,(r,n)=>{let s=`@${n}`;return e.push([s,r]),s}),{groups:e,path:t}},ur=(t,e)=>{for(let r=e.length-1;r>=0;r--){let[n]=e[r];for(let s=t.length-1;s>=0;s--)if(t[s].includes(n)){t[s]=t[s].replace(n,e[r][1]);break}}return t},at={},Zt=(t,e)=>{if(t==="*")return"*";let r=t.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(r){let n=`${t}#${e}`;return at[n]||(r[2]?at[n]=e&&e[0]!==":"&&e[0]!=="*"?[n,r[1],new RegExp(`^${r[2]}(?=/${e})`)]:[t,r[1],new RegExp(`^${r[2]}$`)]:at[n]=[t,r[1],!0]),at[n]}return null},te=(t,e)=>{try{return e(t)}catch{return t.replace(/(?:%[0-9A-Fa-f]{2})+/g,r=>{try{return e(r)}catch{return r}})}},pr=t=>te(t,decodeURI),kt=t=>{let e=t.url,r=e.indexOf("/",e.indexOf(":")+4),n=r;for(;n<e.length;n++){let s=e.charCodeAt(n);if(s===37){let a=e.indexOf("?",n),o=e.indexOf("#",n),i=a===-1?o===-1?void 0:o:o===-1?a:Math.min(a,o),c=e.slice(r,i);return pr(c.includes("%25")?c.replace(/%25/g,"%2525"):c)}else if(s===63||s===35)break}return e.slice(r,n)};var ee=t=>{let e=kt(t);return e.length>1&&e.at(-1)==="/"?e.slice(0,-1):e},H=(t,e,...r)=>(r.length&&(e=H(e,...r)),`${t?.[0]==="/"?"":"/"}${t}${e==="/"?"":`${t?.at(-1)==="/"?"":"/"}${e?.[0]==="/"?e.slice(1):e}`}`),ot=t=>{if(t.charCodeAt(t.length-1)!==63||!t.includes(":"))return null;let e=t.split("/"),r=[],n="";return e.forEach(s=>{if(s!==""&&!/\:/.test(s))n+="/"+s;else if(/\:/.test(s))if(s.charCodeAt(s.length-1)===63){r.length===0&&n===""?r.push("/"):r.push(n);let a=s.slice(0,-1);n+="/"+a,r.push(n)}else n+="/"+s}),r.filter((s,a,o)=>o.indexOf(s)===a)},it=t=>t.indexOf("%")!==-1?te(t,hr):t,vt=t=>(t.indexOf("+")!==-1&&(t=t.replace(/\+/g," ")),it(t)),re=(t,e,r)=>{let n;if(!r&&e&&e.indexOf("%")===-1&&e.indexOf("+")===-1){let o=t.indexOf("?",8);if(o===-1)return;for(t.startsWith(e,o+1)||(o=t.indexOf(`&${e}`,o+1));o!==-1;){let i=t.charCodeAt(o+e.length+1);if(i===61){let c=o+e.length+2,l=t.indexOf("&",c);return vt(t.slice(c,l===-1?void 0:l))}else if(i==38||isNaN(i))return"";o=t.indexOf(`&${e}`,o+1)}if(n=/[%+]/.test(t),!n)return}let s=Object.create(null);n??=/[%+]/.test(t);let a=t.indexOf("?",8);for(;a!==-1;){let o=t.indexOf("&",a+1),i=t.indexOf("=",a);i>o&&o!==-1&&(i=-1);let c=t.slice(a+1,i===-1?o===-1?void 0:o:i);if(n&&(c=vt(c)),a=o,c==="")continue;let l;i===-1?l="":(l=t.slice(i+1,o===-1?void 0:o),n&&(l=vt(l))),r?(s[c]&&Array.isArray(s[c])||(s[c]=[]),s[c].push(l)):s[c]??=l}return e?s[e]:s},ne=re,se=(t,e)=>re(t,e,!0),hr=decodeURIComponent;var ae=class{raw;#e;#t;routeIndex=0;path;bodyCache={};constructor(t,e="/",r=[[]]){this.raw=t,this.path=e,this.#t=r}param(t){return t?this.#r(t):this.#a()}#r(t){let e=this.#t[0][this.routeIndex][1][t],r=this.#n(e);return r&&it(r)}#a(){let t={},e=Object.keys(this.#t[0][this.routeIndex][1]);for(let r of e){let n=this.#n(this.#t[0][this.routeIndex][1][r]);n!==void 0&&(t[r]=it(n))}return t}#n(t){return this.#t[1]?this.#t[1][t]:t}query(t){return ne(this.url,t)}queries(t){return se(this.url,t)}header(t){if(t)return this.raw.headers.get(t)??void 0;let e=Object.create(null);return this.raw.headers.forEach((r,n)=>{e[n]=r}),e}async parseBody(t){return Qt(this,t)}#s=t=>{let{bodyCache:e,raw:r}=this,n=e[t];if(n)return n;for(let s in e)return e[s].then(a=>(s==="json"&&(a=JSON.stringify(a)),new Response(a)[t]()));return e[t]=r[t]()};json(){return this.#s("text").then(t=>JSON.parse(t))}text(){return this.#s("text")}arrayBuffer(){return this.#s("arrayBuffer")}bytes(){return this.#s("arrayBuffer").then(t=>new Uint8Array(t))}blob(){return this.#s("blob")}formData(){return this.#s("formData")}addValidatedData(t,e){(this.#e??={})[t]=e}valid(t){return this.#e?.[t]}get url(){return this.raw.url}get method(){return this.raw.method}get[Kt](){return this.#t}get matchedRoutes(){return this.#t[0].map(([[,t]])=>t)}get routePath(){return this.#t[0].map(([[,t]])=>t)[this.routeIndex].path}};var oe={Stringify:1,BeforeStream:2,Stream:3},fr=(t,e)=>{let r=new String(t);return r.isEscaped=!0,r.callbacks=e,r};var _t=async(t,e,r,n,s)=>{typeof t=="object"&&!(t instanceof String)&&(t instanceof Promise||(t=t.toString()),t instanceof Promise&&(t=await t));let a=t.callbacks;if(!a?.length)return Promise.resolve(t);s?s[0]+=t:s=[t];let o=Promise.all(a.map(i=>i({phase:e,buffer:s,context:n}))).then(i=>Promise.all(i.filter(Boolean).map(c=>_t(c,e,!1,n,s))).then(()=>s[0]));return r?fr(await o,a):o};var mr="text/plain; charset=UTF-8",At=(t,e)=>({"Content-Type":t,...e}),X=(t,e)=>new Response(t,e),St=class{#e;#t;env={};#r;finalized=!1;error;#a;#n;#s;#d;#c;#l;#i;#u;#p;constructor(t,e){this.#e=t,e&&(this.#n=e.executionCtx,this.env=e.env,this.#l=e.notFoundHandler,this.#p=e.path,this.#u=e.matchResult)}get req(){return this.#t??=new ae(this.#e,this.#p,this.#u),this.#t}get event(){if(this.#n&&"respondWith"in this.#n)return this.#n;throw Error("This context has no FetchEvent")}get executionCtx(){if(this.#n)return this.#n;throw Error("This context has no ExecutionContext")}get res(){return this.#s||=X(null,{headers:this.#i??=new Headers})}set res(t){if(this.#s&&t){t=X(t.body,t);for(let[e,r]of this.#s.headers.entries())if(e!=="content-type")if(e==="set-cookie"){let n=this.#s.headers.getSetCookie();t.headers.delete("set-cookie");for(let s of n)t.headers.append("set-cookie",s)}else t.headers.set(e,r)}this.#s=t,this.finalized=!0}render=(...t)=>(this.#c??=e=>this.html(e),this.#c(...t));setLayout=t=>this.#d=t;getLayout=()=>this.#d;setRenderer=t=>{this.#c=t};header=(t,e,r)=>{this.finalized&&(this.#s=X(this.#s.body,this.#s));let n=this.#s?this.#s.headers:this.#i??=new Headers;e===void 0?n.delete(t):r?.append?n.append(t,e):n.set(t,e)};status=t=>{this.#a=t};set=(t,e)=>{this.#r??=new Map,this.#r.set(t,e)};get=t=>this.#r?this.#r.get(t):void 0;get var(){return this.#r?Object.fromEntries(this.#r):{}}#o(t,e,r){let n=this.#s?new Headers(this.#s.headers):this.#i;if(typeof e=="object"&&e.headers){n??=new Headers;for(let[a,o]of new Headers(e.headers))a==="set-cookie"?n.append(a,o):n.set(a,o)}if(r){if(!n){let a=0;for(let o in r)if(++a>1||typeof r[o]!="string"){n=new Headers;break}}if(n)for(let a in r){let o=r[a];if(typeof o=="string")n.set(a,o);else{n.delete(a);for(let i of o)n.append(a,i)}}}let s=typeof e=="number"?e:e?.status??this.#a;return X(t,{status:s,headers:n??r})}newResponse=(...t)=>this.#o(...t);body=(t,e,r)=>this.#o(t,e,r);text=(t,e,r)=>!this.#i&&!this.#a&&!e&&!r&&!this.finalized?new Response(t):this.#o(t,e,At(mr,r));json=(t,e,r)=>this.#o(JSON.stringify(t),e,At("application/json",r));html=(t,e,r)=>{let n=s=>this.#o(s,e,At("text/html; charset=UTF-8",r));return typeof t=="object"?_t(t,oe.Stringify,!1,{}).then(n):n(t)};redirect=(t,e)=>{let r=String(t);return this.header("Location",/[^\x00-\xFF]/.test(r)?encodeURI(r):r),this.newResponse(null,e??302)};notFound=()=>(this.#l??=()=>X(),this.#l(this))};var A="ALL",ie="all",ce=["get","post","put","delete","options","patch","query"],ct="Can not add a route since the matcher is already built.",lt=class extends Error{};var le="__COMPOSED_HANDLER";var gr=t=>t.text("404 Not Found",404),de=(t,e)=>{if("getResponse"in t){let r=t.getResponse();return e.newResponse(r.body,r)}return console.error(t),e.text("Internal Server Error",500)},ue=class pe{get;post;put;delete;options;patch;query;all;on;use;router;getPath;_basePath="/";#e="/";routes=[];constructor(e={}){[...ce,ie].forEach(a=>{this[a]=(o,...i)=>(typeof o=="string"?this.#e=o:this.#a(a,this.#e,o),i.forEach(c=>{this.#a(a,this.#e,c)}),this)}),this.on=(a,o,...i)=>{for(let c of[o].flat()){this.#e=c;for(let l of[a].flat())i.map(d=>{this.#a(l.toUpperCase(),this.#e,d)})}return this},this.use=(a,...o)=>(typeof a=="string"?this.#e=a:(this.#e="*",o.unshift(a)),o.forEach(i=>{this.#a(A,this.#e,i)}),this);let{strict:n,...s}=e;Object.assign(this,s),this.getPath=n??!0?e.getPath??kt:ee}#t(){let e=new pe({router:this.router,getPath:this.getPath});return e.errorHandler=this.errorHandler,e.#r=this.#r,e.routes=this.routes,e}#r=gr;errorHandler=de;route(e,r){let n=this.basePath(e);return r.routes.map(s=>{let a;r.errorHandler===de?a=s.handler:(a=async(o,i)=>(await wt([],r.errorHandler)(o,()=>s.handler(o,i))).res,a[le]=s.handler),n.#a(s.method,s.path,a,s.basePath)}),this}basePath(e){let r=this.#t();return r._basePath=H(this._basePath,e),r}onError=e=>(this.errorHandler=e,this);notFound=e=>(this.#r=e,this);mount(e,r,n){let s,a;n&&(typeof n=="function"?a=n:(a=n.optionHandler,n.replaceRequest===!1?s=c=>c:s=n.replaceRequest));let o=a?c=>{let l=a(c);return Array.isArray(l)?l:[l]}:c=>{let l;try{l=c.executionCtx}catch{}return[c.env,l]};s||=(()=>{let c=H(this._basePath,e),l=c==="/"?0:c.length;return d=>{let u=new URL(d.url);return u.pathname=this.getPath(d).slice(l)||"/",new Request(u,d)}})();let i=async(c,l)=>{let d=await r(s(c.req.raw),...o(c));if(d)return d;await l()};return this.#a(A,H(e,"*"),i),this}#a(e,r,n,s){e=e.toUpperCase(),r=H(this._basePath,r);let a={basePath:s!==void 0?H(this._basePath,s):this._basePath,path:r,method:e,handler:n};this.router.add(e,r,[n,a]),this.routes.push(a)}#n(e,r){if(e instanceof Error)return this.errorHandler(e,r);throw e}#s(e,r,n,s){if(s==="HEAD")return(async()=>new Response(null,await this.#s(e,r,n,"GET")))();let a=this.getPath(e,{env:n}),o=this.router.match(s,a),i=new St(e,{path:a,matchResult:o,env:n,executionCtx:r,notFoundHandler:this.#r});if(o[0].length===1){let l;try{l=o[0][0][0][0](i,async()=>{i.res=await this.#r(i)})}catch(d){return this.#n(d,i)}return l instanceof Promise?l.then(d=>d||(i.finalized?i.res:this.#r(i))).catch(d=>this.#n(d,i)):l??this.#r(i)}let c=wt(o[0],this.errorHandler,this.#r);return(async()=>{try{let l=await c(i);if(!l.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return l.res}catch(l){return this.#n(l,i)}})()}fetch=(e,...r)=>this.#s(e,r[1],r[0],e.method);request=(e,r,n,s)=>e instanceof Request?this.fetch(r?new Request(e,r):e,n,s):(e=e.toString(),this.fetch(new Request(/^https?:\/\//.test(e)?e:`http://localhost${H("/",e)}`,r),n,s));fire=()=>{addEventListener("fetch",e=>{e.respondWith(this.#s(e.request,e,void 0,e.request.method))})}};var dt=[];function Rt(t,e){let r=this.buildAllMatchers(),n=(s,a)=>{let o=r[s]||r[A],i=o[2][a];if(i)return i;let c=a.match(o[0]);if(!c)return[[],dt];let l=c.indexOf("",1);return[o[1][l],c]};return this.match=n,n(t,e)}var ut="[^/]+",z=".*",F="(?:|/.*)",N=Symbol(),he=new Set(".\\+*[^]$()");function br(t,e){return t.length===1?e.length===1?t<e?-1:1:-1:e.length===1?1:t===z||t===F?e===F?-1:1:e===z||e===F?-1:t===ut?1:e===ut?-1:t.length===e.length?t<e?-1:1:e.length-t.length}var fe=class Tt{#e;#t;#r=Object.create(null);insert(e,r,n,s,a){let o=this;for(let i=0,c=e.length;i<c;i++){let l=e[i],d=l.length===1?l==="*"?i===c-1?["","",z]:["","",ut]:null:l==="/*"?["","",F]:l.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/),u;if(d){let p=d[1],h=d[2]||ut;if(p&&d[2]&&(h===".*"||(h=h.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(h))||h.length===1&&he.has(h)))throw N;if(u=o.#r[h],!u){if(h!==z&&h!==F){for(let m in o.#r)if((h.length>1||m.length>1)&&m!==z&&m!==F)throw N}u=o.#r[h]=new Tt}p!==""&&(u.#t??=s.varIndex++,n.push([p,u.#t]))}else if(u=o.#r[l],!u){for(let p in o.#r)if(p.length>1&&p!==z&&p!==F)throw N;u=o.#r[l]=new Tt}o=u}if(o.#e!==void 0)throw N;o.#e=a?-1:r}buildRegExpStr(){let r=Object.keys(this.#r).sort(br).map(n=>{let s=this.#r[n],a=s.buildRegExpStr();return a===""?"":(typeof s.#t=="number"?`(${n})@${s.#t}`:he.has(n)?`\\${n}`:n)+a}).filter(Boolean);return typeof this.#e=="number"&&this.#e!==-1&&r.unshift(`#${this.#e}`),r.length===0?"":r.length===1?r[0]:"(?:"+r.join("|")+")"}};var Ut=class{#e={varIndex:0};#t=new fe;#r=0;paths=Object.create(null);insert(t,e){if(e){this.#t.insert(t.split(""),0,[],this.#e,!0);return}let r=[],n=[],s=t;for(let o=0;;){let i=!1;if(s=s.replace(/\{[^}]+\}/g,c=>{let l=`@\\${o}`;return n[o]=[l,c],o++,i=!0,l}),!i)break}let a=s.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let o=n.length-1;o>=0;o--){let[i]=n[o];for(let c=a.length-1;c>=0;c--)if(a[c].indexOf(i)!==-1){a[c]=a[c].replace(i,n[o][1]);break}}this.#t.insert(a,this.#r,r,this.#e,!1),this.paths[t]=[this.#r++,r]}buildRegExp(){let t=this.#t.buildRegExpStr();if(t==="")return[/^$/,[],[]];let e=0,r=[],n=[];return t=t.replace(/#(\d+)|@(\d+)|\.\*\$/g,(s,a,o)=>a!==void 0?(r[++e]=Number(a),"$()"):(o!==void 0&&(n[Number(o)]=++e),"")),[new RegExp(`^${t}`),r,n]}};var me=Object.create(null);function ge(t){return me[t]??=new RegExp(t==="*"?"":`^${t.replace(/\/\*$|([.\\+*[^\]$()])/g,(e,r)=>r?`\\${r}`:"(?:|/.*)")}$`)}function yr(){me=Object.create(null)}function pt(t,e){if(t){for(let r of Object.keys(t).sort((n,s)=>s.length-n.length))if(ge(r).test(e))return[...t[r]]}}var ht=class{name="RegExpRouter";#e;#t;#r;constructor(){this.#e={[A]:Object.create(null)},this.#t={[A]:Object.create(null)},this.#r={[A]:new Ut}}#a(t,e){try{this.#r[t].insert(e,!/\*|\/:/.test(e))}catch(r){throw r===N?new lt(e):r}}add(t,e,r){let n=this.#e,s=this.#t;if(!n||!s)throw new Error(ct);n[t]||(this.#r[t]=new Ut,[n,s].forEach(i=>{i[t]=Object.create(null),Object.keys(i[A]).forEach(c=>{i[t][c]=[...i[A][c]],this.#a(t,c)})})),e==="/*"&&(e="*");let a=(e.match(/\/:/g)||[]).length;if(/\*$/.test(e)){let i=ge(e);Object.keys(n).forEach(c=>{(t===A||t===c)&&!n[c][e]&&(this.#a(c,e),n[c][e]=pt(n[c],e)||pt(n[A],e)||[])}),Object.keys(n).forEach(c=>{(t===A||t===c)&&Object.keys(n[c]).forEach(l=>{i.test(l)&&n[c][l].push([r,a])})}),Object.keys(s).forEach(c=>{(t===A||t===c)&&Object.keys(s[c]).forEach(l=>i.test(l)&&s[c][l].push([r,a]))});return}let o=ot(e)||[e];for(let i=0,c=o.length;i<c;i++){let l=o[i];Object.keys(s).forEach(d=>{(t===A||t===d)&&(s[d][l]||(this.#a(d,l),s[d][l]=[...pt(n[d],l)||pt(n[A],l)||[]]),s[d][l].push([r,a-c+i+1]))})}}match=Rt;buildAllMatchers(){let t=Object.create(null);return Object.keys(this.#t).concat(Object.keys(this.#e)).forEach(e=>{t[e]||=this.#n(e)}),this.#e=this.#t=this.#r=void 0,yr(),t}#n(t){let e=this.#e[t],r=this.#t[t],n=this.#r[t],s=Object.create(null),a=[];[e,r].forEach(d=>{for(let u in d){let p=d[u],h=n.paths[u];if(!h){s[u]=[p.map(([w])=>[w,Object.create(null)]),dt];continue}let m=h[1];a[h[0]]=p.map(([w,x])=>{let y=Object.create(null);for(x-=1;x>=0;x--){let[g,v]=m[x];y[g]=v}return[w,y]})}});let[o,i,c]=n.buildRegExp();for(let d=0,u=a.length;d<u;d++)for(let p=0,h=a[d].length;p<h;p++){let m=a[d][p]?.[1];if(!m)continue;let w=Object.keys(m);for(let x=0,y=w.length;x<y;x++)m[w[x]]=c[m[w[x]]]}let l=[];for(let d in i)l[d]=a[i[d]];return[o,l,s]}};var Ct=class{name="SmartRouter";#e=[];#t=[];constructor(t){this.#e=t.routers}add(t,e,r){if(!this.#t)throw new Error(ct);this.#t.push([t,e,r])}match(t,e){if(!this.#t)throw new Error("Fatal error");let r=this.#e,n=this.#t,s=r.length,a=0,o;for(;a<s;a++){let i=r[a];try{for(let c=0,l=n.length;c<l;c++)i.add(...n[c]);o=i.match(t,e)}catch(c){if(c instanceof lt)continue;throw c}this.match=i.match.bind(i),this.#e=[i],this.#t=void 0;break}if(a===s)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,o}get activeRouter(){if(this.#t||this.#e.length!==1)throw new Error("No active router has been determined yet.");return this.#e[0]}};var Pt=Object.create(null),xr=0,be=class ye{#e=[];#t=Object.create(null);#r=[];#a;#n=Pt;insert(e,r,n){let s=this,a=Xt(r),o=new Set,i=0;for(let c of a){let l=a[++i],d=Zt(c,l)||(l===void 0&&c&&c.indexOf("*")===c.length-1?c:null),u=Array.isArray(d),p=u?d[0]:d||c,h=s.#t[p]||=new ye;d&&!h.#a&&(h.#a=d,s.#r.push(h)),s=h,u&&o.add(d[1])}s.#e.push({[e]:{handler:n,possibleKeys:[...o],score:++xr}})}#s(e,r,n,s,a){for(let o=0,i=r.#e.length;o<i;o++){let c=r.#e[o],l=c[n]||c[A];if(l){l.params=Object.create(null),e.push(l);for(let d=0,u=l.possibleKeys.length;d<u;d++){let p=l.possibleKeys[d];l.params[p]=a?.[p]&&!d?a[p]:s[p]??a?.[p]}}}}search(e,r){let n=[];this.#n=Pt;let a=[this],o=Et(r),i=[],c=o.length,l=null;for(let d=0;d<c;d++){let u=o[d],p=d===c-1,h=[];for(let w=0,x=a.length;w<x;w++){let y=a[w],g=y.#t[u];g&&(g.#n=y.#n,p?(g.#t["*"]&&this.#s(n,g.#t["*"],e,y.#n),this.#s(n,g,e,y.#n)):h.push(g));for(let v of y.#r){let b=v.#a,k=y.#n===Pt?{}:{...y.#n};if(typeof b=="string"){(b==="*"||u.startsWith(b.slice(0,-1)))&&(this.#s(n,v,e,y.#n),b==="*"&&(v.#n=k,h.push(v)));continue}let[,f,E]=b;if(!(!u&&E===!0)){if(E!==!0){if(!l){l=[];let Q=r[0]==="/"?1:0;for(let V=0;V<c;V++)l[V]=Q,Q+=o[V].length+1}let P=r.slice(l[d]),C=E.exec(P);if(C){k[f]=C[0],this.#s(n,v,e,y.#n,k),C[0].length===P.length&&v.#t["*"]&&this.#s(n,v.#t["*"],e,y.#n,k);for(let Q in v.#t){v.#n=k;let V=C[0].match(/\//g)?.length??0;(i[V]||=[]).push(v);break}continue}}(E===!0||E.test(u))&&(k[f]=u,p?(this.#s(n,v,e,k,y.#n),v.#t["*"]&&this.#s(n,v.#t["*"],e,k,y.#n)):(v.#n=k,h.push(v)))}}}let m=i.shift();a=m?h.concat(m):h}return n[1]&&n.sort((d,u)=>d.score-u.score),[n.map(({handler:d,params:u})=>[d,u])]}};var Lt=class{name="TrieRouter";#e=new be;add(t,e,r){for(let n of ot(e)||[e])this.#e.insert(t,n,r)}match(t,e){return this.#e.search(t,e)}};var I=class extends ue{constructor(t={}){super(t),this.router=t.router??new Ct({routers:[new ht,new Lt]})}};var xe=t=>{let e={origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH","QUERY"],allowHeaders:[],exposeHeaders:[],...t},r=e.exposeHeaders?.length?e.exposeHeaders.join(","):void 0,n=e.allowHeaders?.length?e.allowHeaders.join(","):void 0,s=(o=>typeof o=="string"?o==="*"?()=>o:i=>o===i?i:null:typeof o=="function"?o:i=>o.includes(i)?i:null)(e.origin),a=(o=>{if(typeof o=="function")return async(i,c)=>(await o(i,c)).join(",");if(Array.isArray(o)){let i=o.join(",");return()=>i}else return()=>""})(e.allowMethods);return async function(i,c){function l(u,p){i.res.headers.set(u,p)}let d=await s(i.req.header("origin")||"",i);if(d&&l("Access-Control-Allow-Origin",d),e.credentials&&l("Access-Control-Allow-Credentials","true"),r&&l("Access-Control-Expose-Headers",r),i.req.method==="OPTIONS"){e.origin!=="*"&&i.res.headers.append("Vary","Origin"),e.maxAge!=null&&l("Access-Control-Max-Age",e.maxAge.toString());let u=await a(i.req.header("origin")||"",i);u&&l("Access-Control-Allow-Methods",u);let p=n;if(!p){let h=i.req.header("Access-Control-Request-Headers");h&&(p=h.split(",").map(m=>m.trim()).join(","))}return p&&(l("Access-Control-Allow-Headers",p),i.res.headers.append("Vary","Access-Control-Request-Headers")),i.res.headers.delete("Content-Length"),i.res.headers.delete("Content-Type"),new Response(null,{headers:i.res.headers,status:204,statusText:"No Content"})}await c(),e.origin!=="*"&&i.header("Vary","Origin",{append:!0})}};function wr(){let{process:t,Deno:e}=globalThis;return!(typeof e?.noColor=="boolean"?e.noColor:t!==void 0?"NO_COLOR"in t?.env:!1)}async function we(){let{navigator:t}=globalThis,e="cloudflare:workers";return!(t!==void 0&&t.userAgent==="Cloudflare-Workers"?await(async()=>{try{return"NO_COLOR"in((await import(e)).env??{})}catch{return!1}})():!wr())}var vr=t=>{let[e,r]=[",","."];return t.map(s=>s.replace(/(\d)(?=(\d\d\d)+(?!\d))/g,"$1"+e)).join(r)},Er=t=>{let e=Date.now()-t;return vr([e<1e3?e+"ms":Math.round(e/1e3)+"s"])},kr=async t=>{if(await we())switch(t/100|0){case 5:return`\x1B[31m${t}\x1B[0m`;case 4:return`\x1B[33m${t}\x1B[0m`;case 3:return`\x1B[36m${t}\x1B[0m`;case 2:return`\x1B[32m${t}\x1B[0m`}return`${t}`};async function ve(t,e,r,n,s=0,a){let o=e==="<--"?`${e} ${r} ${n}`:`${e} ${r} ${n} ${await kr(s)} ${a}`;t(o)}var Ee=(t=console.log)=>async function(r,n){let{method:s,url:a}=r.req,o=a.slice(a.indexOf("/",8));await ve(t,"<--",s,o);let i=Date.now();await n(),await ve(t,"-->",s,o,r.res.status,Er(i))};function ke(t){return t instanceof Uint8Array?t:new Uint8Array(t)}function Bt(t){return/^(\d{1,3}\.){3}\d{1,3}$/.test(t)}function It(){if(typeof crypto.randomUUID=="function")return crypto.randomUUID();let t=new Uint8Array(16);crypto.getRandomValues(t),t[6]=t[6]&15|64,t[8]=t[8]&63|128;let e=Array.from(t).map(r=>r.toString(16).padStart(2,"0"));return`${e.slice(0,4).join("")}-${e.slice(4,6).join("")}-${e.slice(6,8).join("")}-${e.slice(8,10).join("")}-${e.slice(10).join("")}`}function T(){return Math.floor(Date.now()/1e3)}function _e(t){if(!t||t==="unknown")return t;if(t.includes(":")){let r=t.split(":");return r.length>=4?r.slice(0,4).join(":")+"::/64":t}let e=t.split(".");return e.length===4?e.slice(0,3).join(".")+".0/24":t}function Ae(t,e){let r=t[e];e+=1;let n="",s;if(r===1)s="ipv4",n=`${t[e]}.${t[e+1]}.${t[e+2]}.${t[e+3]}`,e+=4;else if(r===3){s="domain";let o=t[e];e+=1,n=new TextDecoder().decode(t.subarray(e,e+o)),e+=o}else if(r===4){s="ipv6";let o=[];for(let i=0;i<16;i+=2)o.push((t[e+i]<<8|t[e+i+1]).toString(16));n=o.join(":"),e+=16}else throw new Error(`unsupported ATYP 0x${r.toString(16)}`);let a=t[e]<<8|t[e+1];return e+=2,{addr:{host:n,port:a,type:s},next:e}}function _r(t){if(t.byteLength<20||t[0]!==0)throw new Error("invalid vless header");let e=t.subarray(1,17),r=Array.from(e).map(l=>l.toString(16).padStart(2,"0")).join(""),n=`${r.slice(0,8)}-${r.slice(8,12)}-${r.slice(12,16)}-${r.slice(16,20)}-${r.slice(20,32)}`,s=17,a=t[s];s+=1+a;let{addr:o,next:i}=Ae(t,s),c=t.subarray(i);return{protocol:"vless",uuid:n,target:o,payload:c.slice(),raw:t.slice()}}function Ar(t){if(t.byteLength<60)throw new Error("trojan header too short");let e;try{if(e=new TextDecoder("ascii").decode(t.subarray(0,56)).toLowerCase(),!/^[0-9a-f]{56}$/.test(e))throw new Error("bad hex")}catch{throw new Error("invalid trojan password header")}let r=56;t[r]===13&&t[r+1]===10&&(r+=2);let n=t[r];if(r+=1,n!==1)throw new Error(`trojan cmd ${n} not supported`);let{addr:s,next:a}=Ae(t,r);r=a,t[r]===13&&t[r+1]===10&&(r+=2);let o=t.subarray(r);return{protocol:"trojan",passwordHash:e,target:s,payload:o.slice(),raw:t.slice()}}function Sr(t){if(t.byteLength<40)throw new Error("vmess header too short");let e=1+16+16;e+=1,e+=1,e+=1;let r=t[e]<<8|t[e+1];e+=2;let n=t[e];e+=1;let s="",a;if(n===1)a="ipv4",s=`${t[e]}.${t[e+1]}.${t[e+2]}.${t[e+3]}`,e+=4;else if(n===3){a="domain";let d=t[e];e+=1,s=new TextDecoder().decode(t.subarray(e,e+d)),e+=d}else if(n===4){a="ipv6";let d=[];for(let u=0;u<16;u+=2)d.push((t[e+u]<<8|t[e+u+1]).toString(16));s=d.join(":"),e+=16}else throw new Error(`vmess: unsupported ATYP 0x${n.toString(16)}`);let o=t.subarray(e,e+16),i=Array.from(o).map(d=>d.toString(16).padStart(2,"0")).join(""),c=`${i.slice(0,8)}-${i.slice(8,12)}-${i.slice(12,16)}-${i.slice(16,20)}-${i.slice(20,32)}`;e+=16;let l=t.subarray(e);return{protocol:"vmess",uuid:c,target:{host:s,port:r,type:a},payload:l.slice(),raw:t.slice()}}function Se(t,e){let r=ke(t);if(e.has("trojan")&&r.byteLength>=58){let n=new TextDecoder("ascii").decode(r.subarray(0,56));if(/^[0-9a-fA-F]{56}$/.test(n)&&r[56]===13&&r[57]===10)return Ar(r)}if(e.has("vless")&&r.byteLength>=20&&r[0]===0)return _r(r);if(e.has("vmess"))return Sr(r);throw new Error("no protocol matched first frame")}function Re(){return new Uint8Array([0,0])}import{connect as mt}from"cloudflare:sockets";var Te=8e3,Rr=8e3;async function jt(t,e,r){let n=mt({hostname:t,port:e});if(await Promise.race([n.opened,new Promise((s,a)=>setTimeout(()=>a(new Error("connect timeout")),Te))]),r&&r.byteLength>0){let s=n.writable.getWriter();await s.write(r),s.releaseLock()}return Z(n)}async function Ue(t,e,r,n){let s=Ce(t);return s.startsWith("http://")||s.startsWith("https://")?Cr(s,e,r,n):s.startsWith("socks4://")?Ur(s,e,r,n):Tr(s,e,r,n)}async function Tr(t,e,r,n){let{user:s,pass:a,host:o,port:i}=Ot(t),c=mt({hostname:o,port:i});await Promise.race([c.opened,ft("socks5 connect")]);let l=c.writable.getWriter(),d=c.readable.getReader();try{let u=s?new Uint8Array([5,2,0,2]):new Uint8Array([5,1,0]);await l.write(u);let p=await G(d,2);if(p[0]!==5)throw new Error("bad socks5 greeting");if(p[1]===2){if(!s)throw new Error("socks5 requires auth");let x=new TextEncoder().encode(s),y=new TextEncoder().encode(a),g=new Uint8Array(3+x.byteLength+y.byteLength);if(g[0]=1,g[1]=x.byteLength,g.set(x,2),g[2+x.byteLength]=y.byteLength,g.set(y,3+x.byteLength),await l.write(g),(await G(d,2))[1]!==0)throw new Error("socks5 auth failed")}let h=Pr(e,r),m=new Uint8Array(3+h.byteLength);m[0]=5,m[1]=1,m[2]=0,m.set(h,3),await l.write(m);let w=await Lr(d);if(w!==0)throw new Error(`socks5 reply 0x${w.toString(16)}`);n&&n.byteLength>0&&await l.write(n)}finally{l.releaseLock(),d.releaseLock()}return Z(c)}async function Ur(t,e,r,n){let{user:s,host:a,port:o}=Ot(t),i=mt({hostname:a,port:o});await Promise.race([i.opened,ft("socks4 connect")]);let c=i.writable.getWriter(),l=i.readable.getReader();try{let d=!Bt(e),u;if(d){let h=new TextEncoder().encode(e);u=new Uint8Array(9+h.byteLength+1),u[0]=4,u[1]=1,u[2]=r>>8&255,u[3]=r&255,u[4]=0,u[5]=0,u[6]=0,u[7]=1,u[8]=0,u.set(h,9),u[9+h.byteLength]=0}else{let h=e.split(".").map(Number);u=new Uint8Array(9),u[0]=4,u[1]=1,u[2]=r>>8&255,u[3]=r&255,u[4]=h[0],u[5]=h[1],u[6]=h[2],u[7]=h[3],u[8]=0}if(s){let h=new TextEncoder().encode(s),m=new Uint8Array(u.byteLength+h.byteLength);m.set(h,0),m.set(u,h.byteLength),u=m}await c.write(u);let p=await G(l,8);if(p[0]!==0||p[1]!==90)throw new Error("socks4 rejected");n&&n.byteLength>0&&await c.write(n)}finally{c.releaseLock(),l.releaseLock()}return Z(i)}async function Cr(t,e,r,n){let{user:s,pass:a,host:o,port:i}=Ot(t),c=mt({hostname:o,port:i});await Promise.race([c.opened,ft("http proxy connect")]);let l=c.writable.getWriter(),d=c.readable.getReader();try{let u=[`CONNECT ${e}:${r} HTTP/1.1`,`Host: ${e}:${r}`,"Proxy-Connection: keep-alive"];if(s){let w=btoa(`${s}:${a??""}`);u.push(`Proxy-Authorization: Basic ${w}`)}u.push("","");let p=new TextEncoder().encode(u.join(`\r
`)),h=new Uint8Array(p.byteLength);h.set(p),await l.write(h);let m=new Uint8Array(new ArrayBuffer(0));for(;;){let{value:w,done:x}=await Promise.race([d.read(),ft("http proxy read")]);if(x)throw new Error("http proxy closed");let y=new Uint8Array(w.byteLength);y.set(w),m=Pe(m,y);let g=Br(m,new Uint8Array([13,10,13,10]));if(g>=0){let v=new TextDecoder().decode(m.subarray(0,g)),b=v.match(/HTTP\/\d\.\d (\d{3})/);if(!b||parseInt(b[1],10)!==200)throw new Error(`http proxy: ${v}`);let k=m.subarray(g+4);if(n&&n.byteLength>0){let f=new Uint8Array(n.byteLength);f.set(n),await l.write(f)}if(k.byteLength>0)return Z(c,k);break}}}finally{l.releaseLock(),d.releaseLock()}return Z(c)}function Z(t,e){let r=!e||e.byteLength===0,n=t.readable,s=r?n:new ReadableStream({start(a){a.enqueue(e),n.pipeTo(new WritableStream({write(o){a.enqueue(o)},close(){a.close()},abort(o){a.error(o)}})).catch(()=>a.close())}});return{writable:t.writable,readable:s,closed:t.closed,close:()=>{try{t.close?.()}catch{}}}}function Pr(t,e){if(Bt(t)){let s=t.split(".").map(Number),a=new Uint8Array(1+4+2);return a[0]=1,a[1]=s[0],a[2]=s[1],a[3]=s[2],a[4]=s[3],a[5]=e>>8&255,a[6]=e&255,a}if(t.includes(":")){let s=t.split(":"),a=new Uint8Array(1+16+2);a[0]=4;for(let o=0;o<8;o++){let i=parseInt(s[o]||"0",16);a[1+o*2]=i>>8&255,a[2+o*2]=i&255}return a[17]=e>>8&255,a[18]=e&255,a}let r=new TextEncoder().encode(t),n=new Uint8Array(1+1+r.byteLength+2);return n[0]=3,n[1]=r.byteLength,n.set(r,2),n[2+r.byteLength]=e>>8&255,n[3+r.byteLength]=e&255,n}async function Lr(t){let e=await G(t,4);if(e[0]!==5)throw new Error("bad socks5 reply");let r=0;for(e[3]===1?r=4:e[3]===3?r=(await G(t,1))[0]:e[3]===4&&(r=16),r+=2;r>0;){let n=await G(t,Math.min(r,1024));r-=n.byteLength}return e[1]}async function G(t,e){let r=[],n=0;for(;n<e;){let{value:a,done:o}=await Promise.race([t.read(),new Promise((i,c)=>setTimeout(()=>c(new Error("proxy read timeout")),Rr))]);if(o)throw new Error("proxy closed early");r.push(a),n+=a.byteLength}return Pe(...r).subarray(0,e)}function Ce(t){if(t.includes("t.me/socks")||t.includes("tg://socks")){let e=t.match(/server=([^&]+)/)?.[1],r=t.match(/port=([^&]+)/)?.[1],n=t.match(/user=([^&]+)/)?.[1],s=t.match(/pass=([^&]+)/)?.[1];if(e&&r)return n&&s?`socks5://${n}:${s}@${e}:${r}`:`socks5://${e}:${r}`}return t}function Ot(t){let r=Ce(t).match(/^(?:socks[45]|https?):\/\/(?:([^@/?#]+)@)?([^:/?#]+)(?::(\d+))?/i);if(!r)throw new Error("bad proxy uri");let n,s;if(r[1]){let[a,o]=r[1].split(":");n=a?decodeURIComponent(a):void 0,s=o?decodeURIComponent(o):void 0}return{user:n,pass:s,host:r[2],port:parseInt(r[3]||"1080",10)}}function Pe(...t){let e=t.reduce((s,a)=>s+a.byteLength,0),r=new Uint8Array(e),n=0;for(let s of t)r.set(s,n),n+=s.byteLength;return r}function Br(t,e){t:for(let r=0;r+e.byteLength<=t.byteLength;r++){for(let n=0;n<e.byteLength;n++)if(t[r+n]!==e[n])continue t;return r}return-1}function ft(t){return new Promise((e,r)=>setTimeout(()=>r(new Error(t)),Te))}function Le(t,e,r={}){let n=r.grainBytes??131072,s=r.grainSilentMs??2,a=r.maxQueueBytes??32*1024*1024,o=!1,i=!1,c=!1,l=0,d=[],u=0,p=null,h=null,m=[],w=new Promise(f=>m.push(f)),x=f=>{try{r.onUp?.(f)}catch{}},y=f=>{try{r.onDown?.(f)}catch{}},g=f=>{if(!o){o=!0,p&&clearTimeout(p);try{e.close?.()}catch{}try{t.readyState===1&&t.close()}catch{}if(f)try{r.onError?.(f)}catch{}try{r.onClose?.()}catch{}m.forEach(E=>E())}},v=async()=>{if(u===0)return;if(h){await h;return}let f=d.length===1?d[0]:Ir(d);d=[],u=0,l-=f.byteLength;let E=e.writable.getWriter();h=(async()=>{try{await E.write(f),x(f.byteLength)}catch(P){g(P)}finally{try{E.releaseLock()}catch{}h=null,u>0&&b()}})(),await h},b=()=>{p||(p=setTimeout(async()=>{p=null;try{await v()}catch(f){g(f)}},s))},k=async f=>{if(o||typeof f.data=="string")return;let E=f.data instanceof Uint8Array?f.data:new Uint8Array(f.data);if(l+=E.byteLength,l>a)return g(new Error("upstream queue overflow"));d.push(E),u+=E.byteLength,u>=n?(p&&(clearTimeout(p),p=null),v().catch(g)):b()};return t.addEventListener("message",k),t.addEventListener("close",()=>{i=!0,g()}),t.addEventListener("error",f=>g(f)),(async()=>{let f=e.readable.getReader();try{for(;;){let{value:E,done:P}=await f.read();if(P)break;if(E.byteLength!==0){if(t.readyState!==1)break;t.send(E),y(E.byteLength)}}}catch(E){g(E)}finally{c=!0;try{f.releaseLock()}catch{}g()}})(),e.closed.catch(g).finally(()=>{c=!0,i&&g()}),{closed:w}}function Ir(t){let e=t.reduce((s,a)=>s+a.byteLength,0),r=new Uint8Array(e),n=0;for(let s of t)r.set(s,n),n+=s.byteLength;return r}var gt=new TextEncoder,da=new TextDecoder;async function K(t){let e=typeof t=="string"?gt.encode(t):t,r=await crypto.subtle.digest("SHA-256",e);return tt(new Uint8Array(r))}async function et(t){let e=typeof t=="string"?gt.encode(t):t;return tt(jr(e))}function jr(t){let e=new Uint32Array([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428]),r=new Uint32Array([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]),n=(d,u)=>d>>>u|d<<32-u,s=t.length*8,a=new Uint8Array(t.length+1);a.set(t),a[t.length]=128;let o=(56-a.length%64+64)%64,i=new Uint8Array(a.length+o+8);i.set(a);let c=new DataView(i.buffer);c.setUint32(i.length-8,Math.floor(s/4294967296)),c.setUint32(i.length-4,s>>>0);for(let d=0;d<i.length;d+=64){let u=new Uint32Array(64);for(let b=0;b<16;b++)u[b]=c.getUint32(d+b*4);for(let b=16;b<64;b++){let k=n(u[b-15],7)^n(u[b-15],18)^u[b-15]>>>3,f=n(u[b-2],17)^n(u[b-2],19)^u[b-2]>>>10;u[b]=u[b-16]+k+u[b-7]+f|0}let[p,h,m,w,x,y,g,v]=e;for(let b=0;b<64;b++){let k=n(x,6)^n(x,11)^n(x,25),f=x&y^~x&g,E=v+k+f+r[b]+u[b]|0,P=n(p,2)^n(p,13)^n(p,22),C=p&h^p&m^h&m,Q=P+C|0;v=g,g=y,y=x,x=w+E|0,w=m,m=h,h=p,p=E+Q|0}e[0]=e[0]+p|0,e[1]=e[1]+h|0,e[2]=e[2]+m|0,e[3]=e[3]+w|0,e[4]=e[4]+x|0,e[5]=e[5]+y|0,e[6]=e[6]+g|0,e[7]=e[7]+v|0}let l=new Uint8Array(28);for(let d=0;d<7;d++)l[d*4]=e[d]>>>24&255,l[d*4+1]=e[d]>>>16&255,l[d*4+2]=e[d]>>>8&255,l[d*4+3]=e[d]&255;return l}function tt(t){let e="";for(let r=0;r<t.byteLength;r++)e+=t[r].toString(16).padStart(2,"0");return e}function Be(t){if(t.length%2!==0)throw new Error("bad hex length");let e=new Uint8Array(t.length/2);for(let r=0;r<e.length;r++)e[r]=parseInt(t.slice(r*2,r*2+2),16);return e}var Ie=1e5,Or=32,Dr=16;async function rt(t){let e=new Uint8Array(Dr);crypto.getRandomValues(e);let r=await je(t,e,Ie);return`pbkdf2$${Ie}$${tt(e)}$${tt(new Uint8Array(r))}`}async function Dt(t,e){if(!e)return!1;if(e.startsWith("pbkdf2$")){let[,r,n,s]=e.split("$"),a=parseInt(r,10),o=Be(n),i=Be(s),c=new Uint8Array(await je(t,o,a));return Mr(c,i)}return/^[0-9a-f]{64}$/i.test(e)?await K(t)===e.toLowerCase():!1}async function je(t,e,r){let n=await crypto.subtle.importKey("raw",gt.encode(t),{name:"PBKDF2",hash:"SHA-256"},!1,["deriveBits"]);return crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:e,iterations:r},n,Or*8)}function Mr(t,e){if(t.byteLength!==e.byteLength)return!1;let r=0;for(let n=0;n<t.byteLength;n++)r|=t[n]^e[n];return r===0}function Mt(t=32){let e=new Uint8Array(t);return crypto.getRandomValues(e),tt(e)}function qr(t){let e=typeof t=="string"?gt.encode(t):t,r="";for(let n=0;n<e.byteLength;n++)r+=String.fromCharCode(e[n]);return btoa(r).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function Oe(){return qr(Mt(20)).slice(0,32)}async function De(t,e,r=1){let n=Nr(t.replace(/\s+/g,"").toUpperCase()),s=Math.floor(Date.now()/3e4);for(let a=-r;a<=r;a++)if(await Hr(n,s+a)===e.padStart(6,"0"))return!0;return!1}function Me(t,e,r){return`otpauth://totp/${encodeURIComponent(e)}:${encodeURIComponent(r)}?secret=${t}&issuer=${encodeURIComponent(e)}&digits=6&period=30`}async function Hr(t,e){let r=new ArrayBuffer(8),n=new DataView(r);n.setUint32(0,Math.floor(e/4294967296)),n.setUint32(4,e>>>0);let s=await crypto.subtle.importKey("raw",t,{name:"HMAC",hash:"SHA-1"},!1,["sign"]),a=new Uint8Array(await crypto.subtle.sign("HMAC",s,new Uint8Array(r))),o=a[a.length-1]&15;return(((a[o]&127)<<24|(a[o+1]&255)<<16|(a[o+2]&255)<<8|a[o+3]&255)%1e6).toString().padStart(6,"0")}function Nr(t){let e="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",r=0,n=0,s=[];for(let a of t){let o=e.indexOf(a);o<0||(n=n<<5|o,r+=5,r>=8&&(r-=8,s.push(n>>>r&255)))}return new Uint8Array(s)}var $r=new TextEncoder,Fr=new TextDecoder,bt=new Map,Wr=5*60*1e3,Vr=2048;async function qe(t,e="A",r="https://cloudflare-dns.com/dns-query"){let n=`${t}:${e}:${r}`,s=bt.get(n);if(s&&Date.now()<s.expires)return s.answers;try{let o={A:1,AAAA:28,CNAME:5}[e]??1,i=zr(t.endsWith(".")?t.slice(0,-1):t),c=new Uint8Array(12+i.byteLength+4),l=new DataView(c.buffer);l.setUint16(0,crypto.getRandomValues(new Uint16Array(1))[0]),l.setUint16(2,256),l.setUint16(4,1),c.set(i,12),l.setUint16(12+i.byteLength,o),l.setUint16(12+i.byteLength+2,1);let d=await fetch(r,{method:"POST",headers:{"content-type":"application/dns-message",accept:"application/dns-message"},body:c});if(!d.ok)return[];let u=new Uint8Array(await d.arrayBuffer()),p=Gr(u);return bt.size>=Vr&&bt.clear(),bt.set(n,{expires:Date.now()+Wr,answers:p}),p}catch{return[]}}function zr(t){let e=t.split("."),r=[];for(let o of e){let i=$r.encode(o);r.push(new Uint8Array([i.byteLength]),i)}r.push(new Uint8Array([0]));let n=r.reduce((o,i)=>o+i.byteLength,0),s=new Uint8Array(n),a=0;for(let o of r)s.set(o,a),a+=o.byteLength;return s}function qt(t,e){let r=[],n=e,s=!1,a=-1,o=128;for(;n<t.byteLength&&o-- >0;){let i=t[n];if(i===0){s||(a=n+1);break}if((i&192)===192){s||(a=n+2),n=(i&63)<<8|t[n+1],s=!0;continue}r.push(Fr.decode(t.subarray(n+1,n+1+i))),n+=i+1}return a===-1&&(a=n+1),{name:r.join("."),end:a}}function Gr(t){let e=new DataView(t.buffer),r=e.getUint16(4),n=e.getUint16(6),s=12;for(let o=0;o<r;o++){let{end:i}=qt(t,s);s=i+4}let a=[];for(let o=0;o<n&&s<t.byteLength;o++){let{end:i}=qt(t,s);s=i;let c=e.getUint16(s);s+=2,s+=2;let l=e.getUint32(s);s+=4;let d=e.getUint16(s);s+=2;let u=s,p="";if(c===1&&d===4)p=`${t[s]}.${t[s+1]}.${t[s+2]}.${t[s+3]}`,a.push({type:"A",data:p,ttl:l});else if(c===28&&d===16){let h=[];for(let m=0;m<16;m+=2)h.push((t[s+m]<<8|t[s+m+1]).toString(16));p=h.join(":"),a.push({type:"AAAA",data:p,ttl:l})}else if(c===5){let{name:h}=qt(t,s);p=h,a.push({type:"CNAME",data:p,ttl:l})}s=u+d}return a}var He=new Set(["0.0.0.0","::","176.103.130.130","176.103.130.131"]);async function Ne(t,e){if(!t)return!1;let n=e.doh||"https://family.cloudflare-dns.com/dns-query";return e.ads&&!e.porn&&(n="https://dns.adguard-dns.com/dns-query"),e.malware&&(n="https://security.cloudflare-dns.com/dns-query"),!!((await qe(t,"A",n)).some(a=>He.has(a.data))||(e.porn||e.ads||e.malware)&&(await qe(t,"AAAA",n)).some(o=>He.has(o.data)))}async function $e(t,e,r){let s=new URL(t.url).pathname.split("/").filter(Boolean),a=new Set(["vless","trojan"]),o;if(s.length>=1&&["vless","trojan","vmess"].includes(s[0])){let d=s[0];a=new Set([d]),o=s.slice(1).join("/")}if(t.headers.get("upgrade")?.toLowerCase()!=="websocket")return new Response("expected websocket",{status:426});let i=new WebSocketPair,[c,l]=[i[0],i[1]];return l.accept(),l.binaryType="arraybuffer",r.waitUntil((async()=>{try{await Kr(l,t,e,a,o)}catch(d){try{l.close(1011,"session error")}catch{}console.error("tunnel session error",d)}})()),new Response(null,{status:101,webSocket:c})}async function Kr(t,e,r,n,s){let a=await new Promise((f,E)=>{let P=setTimeout(()=>E(new Error("first-frame timeout")),15e3);t.addEventListener("message",C=>{if(clearTimeout(P),typeof C.data=="string")return E(new Error("text frame not expected"));f(C.data instanceof Uint8Array?C.data:new Uint8Array(C.data))},{once:!0}),t.addEventListener("close",()=>{clearTimeout(P),E(new Error("closed"))},{once:!0}),t.addEventListener("error",C=>{clearTimeout(P),E(C)},{once:!0})}),o=Se(a,n),i=s||o.uuid||o.passwordHash||"",c;if(o.protocol==="trojan"?c=await r.DB.prepare("SELECT * FROM users WHERE uuid = ? OR trojan_hash = ? LIMIT 1").bind(i,o.passwordHash??i).first().then(f=>f??void 0):c=await r.DB.prepare("SELECT * FROM users WHERE uuid = ? OR username = ? COLLATE NOCASE LIMIT 1").bind(i,i).first().then(f=>f??void 0),!c){t.close(1008,"unauthorized");return}let l=(c.connection_type||"vless").toLowerCase(),d=l.includes("vless"),u=l.includes("trojan"),p=l.includes("vmess");if(o.protocol==="vless"&&!d){t.close(1008,"protocol disabled");return}if(o.protocol==="trojan"&&!u){t.close(1008,"protocol disabled");return}if(o.protocol==="vmess"&&!p){t.close(1008,"protocol disabled");return}if(o.protocol==="trojan"){let f=c.trojan_hash||await et(c.uuid);if(o.passwordHash!==f){t.close(1008,"bad password");return}}else if(o.uuid&&o.uuid.toLowerCase()!==c.uuid.toLowerCase()){t.close(1008,"bad uuid");return}if(c.is_active!==1){t.close(1008,"disabled");return}if(c.limit_gb!=null&&(c.used_gb??0)>=c.limit_gb){t.close(1008,"quota");return}if(c.limit_req!=null&&(c.used_req??0)>=c.limit_req){t.close(1008,"req quota");return}if(c.expiry_days!=null){let f=typeof c.created_at=="number"?c.created_at:Date.parse(c.created_at)/1e3;if(Date.now()/1e3>f+c.expiry_days*86400){t.close(1008,"expired");return}}let h=e.headers.get("CF-Connecting-IP")||"unknown",m=_e(h),w=e.headers.get("User-Agent")||"",x=r.USER_STATE.idFromName(c.username),y=r.USER_STATE.get(x),g=await y.fetch(new URL("http://do/connect?ipLimit="+(c.ip_limit??0),"http://do").toString(),{method:"POST",body:JSON.stringify({ip:h,subnet:m,ua:w})});if(!g.ok){let f=await g.json();t.close(1008,f.code||"limit");return}if(o.protocol==="vless"&&t.send(Re()),o.target.type==="domain"&&(c.block_porn||c.block_ads||c.block_malware))try{if(await Ne(o.target.host,{porn:c.block_porn===1,ads:c.block_ads===1,malware:c.block_malware===1,doh:c.doh_url||void 0})){t.close(1008,"blocked");return}}catch{}let v;try{let f=await Jr(c,r);f?v=await Ue(f,o.target.host,o.target.port,o.payload):v=await jt(o.target.host,o.target.port,o.payload)}catch(f){try{let E=Yr(r);if(E)v=await jt(E,o.target.port,o.payload);else throw f}catch{await y.fetch("http://do/disconnect",{method:"POST",body:JSON.stringify({subnet:m})}),t.close(1011,"upstream failed");return}}await r.DB.prepare("UPDATE users SET used_req = used_req + 1, last_active = ? WHERE username = ?").bind(Math.floor(Date.now()/1e3),c.username).run().catch(()=>{});let b={up:0,down:0},k=Date.now();Le(t,v,{grainBytes:128*1024,onUp:f=>{b.up+=f,y.fetch("http://do/addBytes",{method:"POST",body:JSON.stringify({bytes:f})}).catch(()=>{})},onDown:f=>{b.down+=f,y.fetch("http://do/addBytes",{method:"POST",body:JSON.stringify({bytes:f})}).catch(()=>{})},onClose:()=>{y.fetch("http://do/disconnect",{method:"POST",body:JSON.stringify({subnet:m})}).catch(()=>{});let f=Math.floor(k/36e5)*3600,E=b.up+b.down;r.DB.prepare(`INSERT INTO traffic_hourly (hour_bucket, username, bytes_up, bytes_down, requests)
         VALUES (?, ?, ?, ?, 1)
         ON CONFLICT(hour_bucket, username) DO UPDATE SET
           bytes_up = bytes_up + excluded.bytes_up,
           bytes_down = bytes_down + excluded.bytes_down,
           requests = requests + 1`).bind(f,c.username,b.up,b.down).run().catch(()=>{});try{r.METRICS?.writeDataPoint?.({blobs:[c.username,"session"],doubles:[E,Date.now()-k]})}catch{}}})}async function Jr(t,e){if(t.user_socks5)try{if(t.user_socks5.trim().startsWith("[")){let r=JSON.parse(t.user_socks5);if(Array.isArray(r)&&r.length)return r[Math.floor(Math.random()*r.length)]}return t.user_socks5}catch{return t.user_socks5}if(t.user_proxy_iata)try{let r=e.POOL_STATE.idFromName("global"),n=e.POOL_STATE.get(r),s=t.user_proxy_iata.toUpperCase(),a=await n.fetch(`http://do/pick?cc=${encodeURIComponent(s)}`);if(a.ok)return(await a.json()).uri}catch{}return null}function Yr(t){let e=(t.PROXY_FALLBACK_HOSTS||"").split(",").map(n=>n.trim()).filter(Boolean);return e.length?`${e[Math.floor(Math.random()*e.length)]}.proxyip.cmliussss.net`:null}var Ht="aether_session",Fe=60*60*24*7;async function L(t,e){let r=t.env,n=t.req.header("authorization");if(n&&n.toLowerCase().startsWith("bearer ")){let o=n.slice(7).trim(),i=await K(o),c=await r.DB.prepare("SELECT * FROM api_tokens WHERE token_hash = ? AND (expires_at IS NULL OR expires_at > ?)").bind(i,Math.floor(Date.now()/1e3)).first();if(c)return t.set("actor",`token:${c.name}`),t.set("scopes",Qr(c.scopes)||[]),t.set("authKind","token"),await r.DB.prepare("UPDATE api_tokens SET last_used = ? WHERE id = ?").bind(Math.floor(Date.now()/1e3),c.id).run().catch(()=>{}),e()}let a=(t.req.header("cookie")||"").split(";").map(o=>o.trim()).find(o=>o.startsWith(Ht+"="));if(a){let o=a.split("=").slice(1).join("="),i=await K(o),c=await r.DB.prepare(`SELECT s.*, a.username, a.role
         FROM sessions s JOIN admins a ON a.id = s.admin_id
        WHERE s.token_hash = ? AND s.expires_at > ?`).bind(i,Math.floor(Date.now()/1e3)).first();if(c)return t.set("actor",c.username),t.set("adminId",c.admin_id),t.set("role",c.role),t.set("authKind","session"),e()}return t.json({error:"unauthorized"},401)}function S(...t){return async(e,r)=>{let n=e.get("role");return e.get("authKind")==="token"?(e.get("scopes")||[]).includes("admin")?r():e.json({error:"forbidden"},403):!n||!t.includes(n)?e.json({error:"forbidden"},403):r()}}async function We(t,e,r){let n=crypto.randomUUID()+crypto.randomUUID(),s=await K(n),a=t.req.header("user-agent")||"",o=t.req.header("CF-Connecting-IP")||"",i=Math.floor(Date.now()/1e3);await r.DB.prepare("INSERT INTO sessions (token_hash, admin_id, user_agent, ip, expires_at, created_at) VALUES (?,?,?,?,?,?)").bind(s,e,a,o,i+Fe,i).run(),ze(t,n,i+Fe)}async function Ve(t,e){let n=(t.req.header("cookie")||"").split(";").map(s=>s.trim()).find(s=>s.startsWith(Ht+"="));if(n){let s=n.split("=").slice(1).join("="),a=await K(s);await e.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(a).run().catch(()=>{})}ze(t,"",0)}function ze(t,e,r){let s="Lax",a=[`${Ht}=${e}`,"Path=/",`Max-Age=${r}`,"HttpOnly",s?`SameSite=${s}`:"","Secure"].filter(Boolean);t.header("Set-Cookie",a.join("; "))}function Qr(t){try{return JSON.parse(t)}catch{return null}}var j=new I;j.post("/setup",async t=>{let e=t.env,r=await e.DB.prepare("SELECT COUNT(*) AS n FROM admins").first();if(r&&r.n>0)return t.json({error:"already initialized"},400);let n=await t.req.json();if(!n.username||!n.password||n.password.length<8)return t.json({error:"username and password (>=8 chars) required"},400);let s=await rt(n.password);return await e.DB.prepare("INSERT INTO admins (username, password_hash, role, is_active) VALUES (?,?, 'owner', 1)").bind(n.username,s).run(),t.json({ok:!0})});j.post("/auto-bootstrap",async t=>{let e=t.env;if(!e.ADMIN_BOOTSTRAP_PASSWORD)return t.json({error:"no bootstrap secret"},400);let r=await e.DB.prepare("SELECT COUNT(*) AS n FROM admins").first();if(r&&r.n>0)return t.json({ok:!0,already:!0});let n=await rt(e.ADMIN_BOOTSTRAP_PASSWORD);return await e.DB.prepare("INSERT INTO admins (username, password_hash, role, is_active) VALUES (?, ?, 'owner', 1)").bind("admin",n).run(),t.json({ok:!0})});j.post("/login",async t=>{let e=t.env,r=await t.req.json(),n=await e.DB.prepare("SELECT * FROM admins WHERE username = ? AND is_active = 1").bind(r.username).first();if(!n||!await Dt(r.password,n.password_hash))return t.json({error:"invalid credentials"},401);if(n.totp_secret&&(!r.totp||!await De(n.totp_secret,r.totp)))return t.json({error:"totp required"},401);if(!n.password_hash.startsWith("pbkdf2$")){let s=await rt(r.password);await e.DB.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").bind(s,n.id).run()}return await e.DB.prepare("UPDATE admins SET last_login = ? WHERE id = ?").bind(T(),n.id).run(),await We(t,n.id,e),t.json({ok:!0})});j.post("/logout",async t=>(await Ve(t,t.env),t.json({ok:!0})));j.get("/me",L,async t=>t.json({actor:t.get("actor"),role:t.get("role"),kind:t.get("authKind")}));j.post("/change-password",L,async t=>{let e=t.env,r=t.get("adminId");if(!r)return t.json({error:"session required"},403);let n=await t.req.json();if(!n.next||n.next.length<8)return t.json({error:"password too short"},400);let s=await e.DB.prepare("SELECT password_hash FROM admins WHERE id = ?").bind(r).first();return!s||!await Dt(n.current,s.password_hash)?t.json({error:"bad current password"},400):(await e.DB.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").bind(await rt(n.next),r).run(),t.json({ok:!0}))});j.post("/2fa/enroll",L,async t=>{let e=t.get("adminId");if(!e)return t.json({error:"session required"},403);let r=Oe();await t.env.DB.prepare("UPDATE admins SET totp_secret = ? WHERE id = ?").bind(r,e).run();let n=await t.env.DB.prepare("SELECT username FROM admins WHERE id = ?").bind(e).first();return t.json({secret:r,uri:Me(r,"Aether Panel",n.username)})});j.post("/2fa/disable",L,async t=>{let e=t.get("adminId");return e?(await t.env.DB.prepare("UPDATE admins SET totp_secret = NULL WHERE id = ?").bind(e).run(),t.json({ok:!0})):t.json({error:"session required"},403)});j.post("/token",L,async t=>{let e=await t.req.json(),r=Mt(32),n=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(r)),s=Array.from(new Uint8Array(n)).map(o=>o.toString(16).padStart(2,"0")).join(""),a=e.ttlDays?T()+e.ttlDays*86400:null;return await t.env.DB.prepare("INSERT INTO api_tokens (name, token_hash, scopes, expires_at) VALUES (?,?,?,?)").bind(e.name,s,JSON.stringify(e.scopes||["read"]),a).run(),t.json({token:r,expiresAt:a})});var O=new I;O.use("*",L);O.get("/",async t=>{let e=t.req.query("q")||"",r=Math.max(1,parseInt(t.req.query("page")||"1",10)),n=Math.min(200,parseInt(t.req.query("pageSize")||"50",10)),s=(r-1)*n,a=`%${e}%`,o=await t.env.DB.prepare("SELECT * FROM users WHERE username LIKE ? OR uuid LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?").bind(a,a,n,s).all(),i=await t.env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE username LIKE ? OR uuid LIKE ?").bind(a,a).first();return t.json({users:o.results,total:i?.n??0,page:r,pageSize:n})});O.get("/:username",async t=>{let e=t.req.param("username"),r=await t.env.DB.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").bind(e).first();return r?t.json(r):t.json({error:"not found"},404)});O.post("/",S("owner","admin"),async t=>{let e=await t.req.json();if(!e.username)return t.json({error:"username required"},400);let r=e.uuid||It(),n=await et(r),s=T();try{await t.env.DB.prepare(`INSERT INTO users (
        username, uuid, trojan_hash, limit_gb, expiry_days, limit_req,
        connection_type, tls, port, path, sni_host, fingerprint, fragment,
        alpn, ip_limit, block_porn, block_ads, block_malware, doh_url,
        user_socks5, user_proxy_iata, route_direct, route_block, auto_rotate_proxy,
        auto_reset_vol_days, auto_reset_req_days,
        last_reset_vol_time, last_reset_req_time,
        is_active, note, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(e.username,r,n,U(e.limitGb),U(e.expiryDays),U(e.limitReq),e.connectionType||"vless+trojan",e.tls||"on",U(e.port)??443,e.path||"/",e.sniHost||null,e.fingerprint||"chrome",e.fragment||null,e.alpn||"h2,http/1.1",U(e.ipLimit),$(e.blockPorn),$(e.blockAds),$(e.blockMalware),e.dohUrl||null,e.userSocks5||null,e.userProxyIata||null,e.routeDirect||null,e.routeBlock||null,$(e.autoRotateProxy),U(e.autoResetVolDays)??0,U(e.autoResetReqDays)??0,s,s,e.isActive===!1?0:1,e.note||null,s,s).run()}catch(a){return t.json({error:a.message},400)}return t.json({ok:!0,uuid:r,trojanHash:n})});O.patch("/:username",S("owner","admin"),async t=>{let e=t.req.param("username"),r=await t.req.json(),n=[],s=[],a={username:{col:"username",val:r.username},limitGb:{col:"limit_gb",val:U(r.limitGb)},expiryDays:{col:"expiry_days",val:U(r.expiryDays)},limitReq:{col:"limit_req",val:U(r.limitReq)},connectionType:{col:"connection_type",val:r.connectionType},tls:{col:"tls",val:r.tls},port:{col:"port",val:U(r.port)},path:{col:"path",val:r.path},sniHost:{col:"sni_host",val:r.sniHost},fingerprint:{col:"fingerprint",val:r.fingerprint},fragment:{col:"fragment",val:r.fragment},alpn:{col:"alpn",val:r.alpn},ipLimit:{col:"ip_limit",val:U(r.ipLimit)},blockPorn:{col:"block_porn",val:$(r.blockPorn)},blockAds:{col:"block_ads",val:$(r.blockAds)},blockMalware:{col:"block_malware",val:$(r.blockMalware)},dohUrl:{col:"doh_url",val:r.dohUrl},userSocks5:{col:"user_socks5",val:r.userSocks5},userProxyIata:{col:"user_proxy_iata",val:r.userProxyIata},routeDirect:{col:"route_direct",val:r.routeDirect},routeBlock:{col:"route_block",val:r.routeBlock},autoRotateProxy:{col:"auto_rotate_proxy",val:$(r.autoRotateProxy)},isActive:{col:"is_active",val:r.isActive===void 0?void 0:r.isActive?1:0},note:{col:"note",val:r.note},autoResetVolDays:{col:"auto_reset_vol_days",val:U(r.autoResetVolDays)},autoResetReqDays:{col:"auto_reset_req_days",val:U(r.autoResetReqDays)}};for(let o of Object.keys(r)){let i=a[o];i&&i.val!==void 0&&(n.push(`${i.col} = ?`),s.push(i.val))}return n.length?(n.push("updated_at = ?"),s.push(T()),s.push(e),await t.env.DB.prepare(`UPDATE users SET ${n.join(", ")} WHERE username = ? COLLATE NOCASE`).bind(...s).run(),t.json({ok:!0})):t.json({ok:!0})});O.delete("/:username",S("owner","admin"),async t=>(await t.env.DB.prepare("DELETE FROM users WHERE username = ? COLLATE NOCASE").bind(t.req.param("username")).run(),t.json({ok:!0})));O.post("/bulk",S("owner","admin"),async t=>{let e=await t.req.json();if(!e.usernames?.length)return t.json({error:"no users"},400);let r=e.usernames.map(()=>"?").join(",");if(e.action==="delete")await t.env.DB.prepare(`DELETE FROM users WHERE username IN (${r})`).bind(...e.usernames).run();else if(e.action==="disable"||e.action==="enable"){let n=e.action==="enable"?1:0;await t.env.DB.prepare(`UPDATE users SET is_active = ? WHERE username IN (${r})`).bind(n,...e.usernames).run()}else e.action==="resetVol"?await t.env.DB.prepare(`UPDATE users SET used_gb = 0 WHERE username IN (${r})`).bind(...e.usernames).run():e.action==="resetReq"&&await t.env.DB.prepare(`UPDATE users SET used_req = 0 WHERE username IN (${r})`).bind(...e.usernames).run();return t.json({ok:!0})});O.post("/:username/reset-uuid",S("owner","admin"),async t=>{let e=It(),r=await et(e);return await t.env.DB.prepare("UPDATE users SET uuid = ?, trojan_hash = ? WHERE username = ?").bind(e,r,t.req.param("username")).run(),t.json({ok:!0,uuid:e,trojanHash:r})});function U(t){if(t==null||t==="")return null;let e=Number(t);return Number.isFinite(e)?e:null}function $(t){return t?1:0}var D=new I;D.use("*",L);D.get("/",async t=>{let e=(t.req.query("country")||"").toUpperCase(),r=Math.max(1,parseInt(t.req.query("page")||"1",10)),n=Math.min(200,parseInt(t.req.query("pageSize")||"50",10)),s=(r-1)*n,a=e?"WHERE country = ?":"",o=e?[e,n,s]:[n,s],i=await t.env.DB.prepare(`SELECT * FROM proxies ${a} ORDER BY latency_ms IS NULL, latency_ms ASC LIMIT ? OFFSET ?`).bind(...o).all(),c=await t.env.DB.prepare(`SELECT COUNT(*) AS n FROM proxies ${a}`).bind(...e?[e]:[]).first();return t.json({proxies:i.results,total:c?.n??0})});D.get("/countries",async t=>{let e=await t.env.DB.prepare("SELECT UPPER(country) AS country, COUNT(*) AS count, SUM(CASE WHEN is_active=1 THEN 1 ELSE 0 END) AS active FROM proxies WHERE country IS NOT NULL GROUP BY UPPER(country) ORDER BY count DESC").all();return t.json({countries:e.results})});D.post("/import",S("owner","admin"),async t=>{let e=await t.req.json(),r=[];if(e.url){let s=await fetch(e.url).catch(()=>null);if(!s||!s.ok)return t.json({error:"fetch failed"},400);let a=await s.text();r=Ge(a,e.country)}else e.rawText?r=Ge(e.rawText,e.country):Array.isArray(e.list)&&(r=e.list.map(s=>Ke(s)).filter(Boolean).map(s=>({uri:s,country:(e.country||"XX").toUpperCase()})));if(!r.length)return t.json({error:"no proxies parsed"},400);let n=r.map(s=>t.env.DB.prepare(`INSERT OR IGNORE INTO proxies (uri, country, source, is_active, last_checked, created_at)
       VALUES (?, ?, ?, 1, 0, ?)`).bind(s.uri,s.country,e.source||"manual",T()));return await t.env.DB.batch(n),await J(t.env),t.json({ok:!0,imported:r.length})});D.post("/pool/reload",S("owner","admin"),async t=>{let e=await J(t.env);return t.json({ok:!0,active:e})});D.post("/health",S("owner","admin"),async t=>{let e=t.env.POOL_STATE.idFromName("global");return t.executionCtx.waitUntil(t.env.POOL_STATE.get(e).fetch("http://do/health-check")),t.json({ok:!0,scheduled:!0})});D.delete("/:id",S("owner","admin"),async t=>(await t.env.DB.prepare("DELETE FROM proxies WHERE id = ?").bind(t.req.param("id")).run(),await J(t.env),t.json({ok:!0})));D.post("/:id/toggle",S("owner","admin"),async t=>{let e=await t.env.DB.prepare("SELECT is_active FROM proxies WHERE id = ?").bind(t.req.param("id")).first();return e?(await t.env.DB.prepare("UPDATE proxies SET is_active = ? WHERE id = ?").bind(e.is_active?0:1,t.req.param("id")).run(),await J(t.env),t.json({ok:!0})):t.json({error:"not found"},404)});function Ke(t){let e=t.trim();return!e||e.startsWith("#")?null:/^(socks4|socks5|socks|http|https):\/\//i.test(e)?e:/^[\w.-]+:\d{2,5}$/.test(e)?`socks5://${e}`:null}function Ge(t,e){let r=[],n=(e||"XX").toUpperCase();for(let s of t.split(/\r?\n/)){let a=s.trim();if(!a)continue;if(a.startsWith("#")||a.startsWith("//")){let i=a.match(/[#/]\s*([A-Za-z]{2})\b/);i&&(n=i[1].toUpperCase());continue}if(a.startsWith("["))continue;let o=Ke(a);o&&r.push({uri:o,country:n})}return r}async function J(t){let e=await t.DB.prepare("SELECT uri, country FROM proxies WHERE is_active = 1").all(),r={};for(let o of e.results||[]){let i=(o.country||"XX").toUpperCase();(r[i]||=[]).push(o.uri)}let n=t.POOL_STATE.idFromName("global"),s=t.POOL_STATE.get(n),a=0;for(let[o,i]of Object.entries(r))await s.fetch("http://do/import",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({country:o,list:i})}),a+=i.length;return a}var W=new I;W.use("*",L);W.get("/backup",S("owner","admin"),async t=>{let e=t.env,[r,n,s,a]=await Promise.all([e.DB.prepare("SELECT * FROM users").all(),e.DB.prepare("SELECT * FROM settings").all(),e.DB.prepare("SELECT * FROM proxies").all(),e.DB.prepare("SELECT id, username, role, is_active, created_at FROM admins").all()]),o={version:1,exportedAt:T(),users:r.results,settings:n.results,proxies:s.results,admins:a.results};try{await e.BUCKET?.put?.(`backup-${T()}.json`,JSON.stringify(o),{httpMetadata:{contentType:"application/json"}})}catch{}return t.body(JSON.stringify(o,null,2),200,{"content-type":"application/json","content-disposition":`attachment; filename="aether-backup-${T()}.json"`})});W.post("/restore",S("owner"),async t=>{let e=t.env,r=await t.req.json(),n=0,s=0;if(Array.isArray(r.users)){let a=r.users.map(o=>e.DB.prepare(`INSERT OR REPLACE INTO users
         (username, uuid, trojan_hash, limit_gb, used_gb, lifetime_gb, expiry_days,
          limit_req, used_req, ip_limit, active_ips, connection_type, tls, port,
          path, sni_host, fingerprint, fragment, cipher_suites, alpn, allow_insecure,
          block_porn, block_ads, block_malware, doh_url, route_direct, route_block,
          user_proxy_iata, user_socks5, user_proxy_ip, auto_rotate_proxy,
          auto_rotate_ip, rotate_minutes, ip_operator, ip_count, ips, last_rotate_time,
          auto_reset_vol_days, auto_reset_req_days, last_reset_vol_time, last_reset_req_time,
          is_active, start_on_first_connect, first_connection_time, last_active, note, group_id,
          created_at, updated_at)
         VALUES (@username,@uuid,@trojan_hash,@limit_gb,@used_gb,@lifetime_gb,@expiry_days,
          @limit_req,@used_req,@ip_limit,@active_ips,@connection_type,@tls,@port,
          @path,@sni_host,@fingerprint,@fragment,@cipher_suites,@alpn,@allow_insecure,
          @block_porn,@block_ads,@block_malware,@doh_url,@route_direct,@route_block,
          @user_proxy_iata,@user_socks5,@user_proxy_ip,@auto_rotate_proxy,
          @auto_rotate_ip,@rotate_minutes,@ip_operator,@ip_count,@ips,@last_rotate_time,
          @auto_reset_vol_days,@auto_reset_req_days,@last_reset_vol_time,@last_reset_req_time,
          @is_active,@start_on_first_connect,@first_connection_time,@last_active,@note,@group_id,
          @created_at,@updated_at)`).bind(o));await e.DB.batch(a),n=a.length}if(Array.isArray(r.proxies)){let a=r.proxies.map(o=>e.DB.prepare("INSERT OR IGNORE INTO proxies (uri, country, source, is_active, last_checked, created_at) VALUES (?, ?, ?, 1, 0, ?)").bind(o.uri,o.country||null,o.source||"restore",T()));await e.DB.batch(a),s=a.length}if(Array.isArray(r.settings)){let a=r.settings.map(o=>e.DB.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)").bind(o.key,o.value,T()));await e.DB.batch(a)}return t.json({ok:!0,users:n,proxies:s})});W.get("/settings",async t=>{let e=await t.env.DB.prepare("SELECT key, value FROM settings").all(),r={};for(let n of e.results)r[n.key]=n.value;return t.json(r)});W.put("/settings",S("owner","admin"),async t=>{let e=await t.req.json(),r=Object.entries(e).map(([n,s])=>t.env.DB.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)").bind(n,s,T()));return r.length&&await t.env.DB.batch(r),t.json({ok:!0})});var Xr="https://cdn.jsdelivr.net/gh/nikzadcr-cmyk/aether-panel@main/dist/index.js",Zr="https://cdn.jsdelivr.net/gh/nikzadcr-cmyk/aether-panel@main/migrations/0001_init.sql";async function Je(t){let e=t.token.trim();if(!e)throw new Error("\u062A\u0648\u06A9\u0646 \u062E\u0627\u0644\u06CC \u0627\u0633\u062A");let r={Authorization:"Bearer "+e,"Content-Type":"application/json"},n="https://api.cloudflare.com/client/v4",a=await(await fetch(n+"/user/tokens/verify",{headers:r})).json();if(!a.success)throw new Error("\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: "+(a.errors?.[0]?.message||"unknown"));let i=await(await fetch(n+"/accounts",{headers:r})).json();if(!i.success||!i.result?.length)throw new Error("\u062D\u0633\u0627\u0628 \u06A9\u0644\u0648\u062F\u0641\u0644\u0631 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F: "+(i.errors?.[0]?.message||""));let c=i.result[0].id,l=(t.workerName||"aether-panel-"+sn(6)).toLowerCase(),d=await tn(n,r,c),u=await en(n,r,c);await rn(n,r,c);let p=await fetch(Xr);if(!p.ok)throw new Error("\u062F\u0631\u06CC\u0627\u0641\u062A \u0633\u0648\u0631\u0633 \u0648\u0631\u06A9\u0631 \u0627\u0632 \u06AF\u06CC\u062A\u200C\u0647\u0627\u0628 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F");let h=await p.text(),m=an(32),w=on(),x="admin",y={main_module:"worker.js",compatibility_date:"2025-01-15",compatibility_flags:["nodejs_compat"],migrations:[{tag:"v1",new_sqlite_classes:["UserState","PoolState","RateLimiter"]}],bindings:[{type:"d1",name:"DB",id:d},{type:"kv_namespace",name:"KV",namespace_id:u},{type:"queue",name:"WRITE_QUEUE",queue_name:"aether-writes"},{type:"durable_object_namespace",name:"USER_STATE",class_name:"UserState",script_name:l},{type:"durable_object_namespace",name:"POOL_STATE",class_name:"PoolState",script_name:l},{type:"durable_object_namespace",name:"RATE_LIMIT",class_name:"RateLimiter",script_name:l},{type:"plain_text",name:"APP_NAME",text:"Aether Panel"},{type:"plain_text",name:"APP_VERSION",text:"0.1.0"},{type:"plain_text",name:"PRIMARY_FETCH",text:"https://raw.githubusercontent.com/panel-zeus/Z-E-U-S/main/ips.txt"},{type:"plain_text",name:"DEFAULT_DOH",text:"https://cloudflare-dns.com/dns-query"},{type:"plain_text",name:"PROXY_FALLBACK_HOSTS",text:"fra,ams,lhr,cdg,fra2"},{type:"secret_text",name:"PANEL_SECRET",text:m},{type:"secret_text",name:"ADMIN_BOOTSTRAP_PASSWORD",text:w}],observability:{enabled:!0}},g=new FormData;g.set("metadata",new Blob([JSON.stringify(y)],{type:"application/json"})),g.set("worker.js",new Blob([h],{type:"application/javascript+module"}));let b=await(await fetch(n+"/accounts/"+c+"/workers/scripts/"+l,{method:"PUT",headers:{Authorization:"Bearer "+e},body:g})).json();if(!b.success)throw new Error("\u0622\u067E\u0644\u0648\u062F \u0648\u0631\u06A9\u0631 \u0646\u0627\u0645\u0648\u0641\u0642: "+(b.errors?.[0]?.message||"unknown"));await fetch(n+"/accounts/"+c+"/workers/scripts/"+l+"/subdomain",{method:"POST",headers:r,body:JSON.stringify({enabled:!0})}).catch(()=>{}),await fetch(n+"/accounts/"+c+"/workers/subdomain",{method:"PUT",headers:r,body:JSON.stringify({subdomain:c.slice(0,12)})}).catch(()=>{}),await nn(n,r,c,d),await fetch(n+"/accounts/"+c+"/workers/scripts/"+l+"/queues",{method:"POST",headers:r,body:JSON.stringify({queue_name:"aether-writes",dead_letter_queue:void 0,settings:{batch_size:100,max_retries:3,max_concurrency:5}})}).catch(()=>{}),await fetch(n+"/accounts/"+c+"/workers/scripts/"+l+"/schedules",{method:"PUT",headers:r,body:JSON.stringify({schedules:[{cron:"* * * * *"},{cron:"*/5 * * * *"},{cron:"0 * * * *"}]})}).catch(()=>{});let k="https://"+l+"."+c.slice(0,12)+".workers.dev";return{ok:!0,workerName:l,url:k,d1Id:d,kvId:u,adminUser:x,adminPassword:w,panelSecret:m}}async function tn(t,e,r){let a=(await(await fetch(t+"/accounts/"+r+"/d1/database?name=aether",{headers:e})).json()).result?.find(c=>c.name==="aether");if(a)return a.uuid;let i=await(await fetch(t+"/accounts/"+r+"/d1/database",{method:"POST",headers:e,body:JSON.stringify({name:"aether"})})).json();if(!i.success||!i.result)throw new Error("\u0633\u0627\u062E\u062A D1 \u0646\u0627\u0645\u0648\u0641\u0642: "+(i.errors?.[0]?.message||""));return i.result.uuid}async function en(t,e,r){let a=((await(await fetch(t+"/accounts/"+r+"/storage/kv/namespaces?per_page=100",{headers:e})).json()).result||[]).find(c=>c.title==="aether-kv");if(a)return a.id;let i=await(await fetch(t+"/accounts/"+r+"/storage/kv/namespaces",{method:"POST",headers:e,body:JSON.stringify({title:"aether-kv"})})).json();if(!i.success||!i.result)throw new Error("\u0633\u0627\u062E\u062A KV \u0646\u0627\u0645\u0648\u0641\u0642: "+(i.errors?.[0]?.message||""));return i.result.id}async function rn(t,e,r){((await(await fetch(t+"/accounts/"+r+"/queues",{headers:e})).json()).result||[]).some(a=>a.queue_name==="aether-writes")||await fetch(t+"/accounts/"+r+"/queues",{method:"POST",headers:e,body:JSON.stringify({queue_name:"aether-writes"})})}async function nn(t,e,r,n){let s=await fetch(Zr);if(!s.ok)return;let o=(await s.text()).split(/;\s*\n/).map(i=>i.trim()).filter(Boolean);for(let i of o)await fetch(t+"/accounts/"+r+"/d1/database/"+n+"/query",{method:"POST",headers:e,body:JSON.stringify({sql:i})}).catch(()=>{})}function sn(t){let e="abcdefghijklmnopqrstuvwxyz0123456789",r="",n=new Uint8Array(t);crypto.getRandomValues(n);for(let s=0;s<t;s++)r+=e[n[s]%e.length];return r}function an(t){let e=new Uint8Array(t);return crypto.getRandomValues(e),Array.from(e).map(r=>r.toString(16).padStart(2,"0")).join("")}function on(){let t="ABCDEFGHJKLMNPQRSTUVWXYZ",e="abcdefghijkmnpqrstuvwxyz",r="23456789",n=t+e+r,s=[],a=new Uint8Array(12);crypto.getRandomValues(a),s.push(t[a[0]%t.length]),s.push(e[a[1]%e.length]),s.push(r[a[2]%r.length]);for(let o=3;o<12;o++)s.push(n[a[o]%n.length]);for(let o=s.length-1;o>0;o--){let i=a[o]%(o+1);[s[o],s[i]]=[s[i],s[o]]}return s.join("")}var q={inline_keyboard:[[{text:"\u2795 \u062B\u0628\u062A \u062D\u0633\u0627\u0628 \u06A9\u0644\u0648\u062F\u0641\u0644\u0631",callback_data:"menu:register"}],[{text:"\u{1F680} \u0633\u0627\u062E\u062A \u067E\u0646\u0644 \u062C\u062F\u06CC\u062F",callback_data:"menu:build"}],[{text:"\u{1F504} \u0622\u067E\u062F\u06CC\u062A \u067E\u0646\u0644",callback_data:"menu:update"}],[{text:"\u{1F511} \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0631\u0645\u0632",callback_data:"menu:recover"}],[{text:"\u{1F4CA} \u0644\u06CC\u0633\u062A \u062D\u0633\u0627\u0628\u200C\u0647\u0627",callback_data:"menu:list"}],[{text:"\u2139\uFE0F \u0631\u0627\u0647\u0646\u0645\u0627",callback_data:"menu:help"}]]};async function Qe(t,e){if(!e.TELEGRAM_TOKEN)return new Response("bot disabled",{status:404});let r=await t.json();try{if(r.callback_query)return cn(r.callback_query,e);if(r.message)return ln(r.message,e)}catch(n){console.error("tg error",n)}return new Response("ok")}async function cn(t,e){let r=t.message?.chat;if(!r)return await R(e,t.id),new Response("ok");let[n,s,a]=t.data.split(":");if(n!=="menu"&&n!=="acct")return await R(e,t.id),new Response("ok");if(n==="acct"){let o=await Y(e,r.id)||{accounts:[]},i=o.accounts?.find(c=>c.id===s);if(!i)return await R(e,t.id,"\u062D\u0633\u0627\u0628 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F",!0),new Response("ok");if(a==="build")return await R(e,t.id),await dn(e,r.id,i,o),new Response("ok");if(a==="update"){await R(e,t.id,"\u062F\u0631 \u062D\u0627\u0644 \u0622\u067E\u062F\u06CC\u062A...");try{let d=(await(await fetch("https://api.cloudflare.com/client/v4/accounts",{headers:{Authorization:"Bearer "+i.token}})).json()).result?.[0]?.id;if(!d)throw new Error("\u062D\u0633\u0627\u0628 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F");let u=i.worker||"aether-panel";if(!(await fetch("https://cdn.jsdelivr.net/gh/nikzadcr-cmyk/aether-panel@main/dist/index.js")).ok)throw new Error("bundle fetch failed");await un(i.token,d,u,{d1:"",kv:"",panelSecret:"",adminPassword:""}),await B(e,r,t.message.message_id,"\u2705 \u0622\u062E\u0631\u06CC\u0646 \u0646\u0633\u062E\u0647 \u0631\u0648\u06CC \u067E\u0646\u0644 \u0634\u0645\u0627 \u062F\u06CC\u067E\u0644\u0648\u06CC \u0634\u062F.")}catch(c){await B(e,r,t.message.message_id,"\u274C \u062E\u0637\u0627 \u062F\u0631 \u0622\u067E\u062F\u06CC\u062A: "+c.message)}return new Response("ok")}if(a==="recover"){let c=Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,6).toUpperCase();try{await M(e,r.id,i.admin?"\u{1F511} \u0631\u0645\u0632 \u067E\u0646\u0644 \u0634\u0645\u0627: "+i.admin:"\u0631\u0645\u0632\u06CC \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A. \u0627\u0632 \u062F\u0627\u062E\u0644 \u067E\u0646\u0644 \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u06A9\u0646.")}catch{}return await R(e,t.id),new Response("ok")}return await R(e,t.id),new Response("ok")}if(s==="register")return await Nt(e,r.id,{step:"awaiting_token",awaiting:"register"}),await B(e,r,t.message.message_id,`\u{1F511} <b>\u0633\u0627\u062E\u062A \u062A\u0648\u06A9\u0646 \u06A9\u0644\u0648\u062F\u0641\u0644\u0631</b>

\u06F1) \u0628\u0631\u0648 \u0628\u0647: https://dash.cloudflare.com/profile/api-tokens
\u06F2) <b>Create Token \u2192 Custom token</b>
\u06F3) \u0627\u06CC\u0646 permission\u0647\u0627 \u0631\u0627 \u0628\u062F\u0647:
   \u2022 Account \xB7 Workers Scripts \u2192 <b>Edit</b>
   \u2022 Account \xB7 D1 \u2192 <b>Edit</b>
   \u2022 Account \xB7 Workers KV \u2192 <b>Edit</b>
   \u2022 Account \xB7 Queues \u2192 <b>Edit</b>
   \u2022 Account Settings \u2192 <b>Read</b>
\u06F4) Account Resources \u2192 <b>All accounts</b>
\u06F5) Create Token \u0648 \u0645\u062A\u0646 \u062A\u0648\u06A9\u0646 \u0631\u0627 \u0647\u0645\u06CC\u0646\u200C\u062C\u0627 \u0628\u0641\u0631\u0633\u062A.

\u23F1 \u062A\u0648\u06A9\u0646 \u0641\u0642\u0637 \u062F\u0631 \u062D\u06CC\u0646 \u0639\u0645\u0644\u06CC\u0627\u062A \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F \u0648 \u0628\u0639\u062F \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC Revoke \u06A9\u0646\u06CC.
\u0628\u0631\u0627\u06CC \u0644\u063A\u0648 /cancel \u0628\u0632\u0646.`,{reply_markup:{inline_keyboard:[[{text:"\u{1F517} \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 \u0633\u0627\u062E\u062A \u062A\u0648\u06A9\u0646",url:"https://dash.cloudflare.com/profile/api-tokens"}]]}}),await R(e,t.id),new Response("ok");if(s==="build"){let o=await Y(e,r.id)||{};if(!o.accounts?.length)return await B(e,r,t.message.message_id,"\u0627\u0648\u0644 \u0628\u0627\u06CC\u062F \u06CC\u06A9 \u062D\u0633\u0627\u0628 \u06A9\u0644\u0648\u062F\u0641\u0644\u0631 \u062B\u0628\u062A \u06A9\u0646\u06CC.",q),await R(e,t.id,"\u062D\u0633\u0627\u0628\u06CC \u062B\u0628\u062A \u0646\u0634\u062F\u0647",!0),new Response("ok");let i={inline_keyboard:o.accounts.map(c=>[{text:"\u{1FA90} "+c.name+(c.panel?" \u2705":""),callback_data:"acct:"+c.id+":build"}]).concat([[{text:"\u2192 \u0645\u0646\u0648\u06CC \u0627\u0635\u0644\u06CC",callback_data:"menu:home"}]])};return await B(e,r,t.message.message_id,"\u0631\u0648\u06CC \u06A9\u062F\u0627\u0645 \u062D\u0633\u0627\u0628 \u0628\u0633\u0627\u0632\u0645\u061F",i),await R(e,t.id),new Response("ok")}if(s==="update"||s==="recover"){let o=await Y(e,r.id)||{};if(!o.accounts?.length)return await B(e,r,t.message.message_id,"\u062D\u0633\u0627\u0628\u06CC \u062B\u0628\u062A \u0646\u0634\u062F\u0647.",q),await R(e,t.id),new Response("ok");let i={inline_keyboard:o.accounts.map(c=>[{text:c.name+(c.panel?" \u2705":""),callback_data:"acct:"+c.id+":"+s}]).concat([[{text:"\u2192 \u0645\u0646\u0648\u06CC \u0627\u0635\u0644\u06CC",callback_data:"menu:home"}]])};return await B(e,r,t.message.message_id,s==="update"?"\u06A9\u062F\u0627\u0645 \u067E\u0646\u0644 \u0622\u067E\u062F\u06CC\u062A \u0634\u0648\u062F\u061F":"\u0631\u0645\u0632 \u06A9\u062F\u0627\u0645 \u067E\u0646\u0644 \u0631\u0627 \u0645\u06CC\u200C\u062E\u0648\u0627\u0647\u06CC\u061F",i),await R(e,t.id),new Response("ok")}if(s==="list"){let i=(await Y(e,r.id)||{}).accounts||[],c=i.length?`\u{1F4CB} <b>\u062D\u0633\u0627\u0628\u200C\u0647\u0627\u06CC \u062A\u0648:</b>

`+i.map((l,d)=>d+1+". "+l.name+(l.panel?`
   \u{1F517} `+l.panel:`
   \u274C \u0633\u0627\u062E\u062A\u0647 \u0646\u0634\u062F\u0647`)).join(`
`):"\u0647\u0646\u0648\u0632 \u062D\u0633\u0627\u0628\u06CC \u062B\u0628\u062A \u0646\u06A9\u0631\u062F\u06CC.";return await B(e,r,t.message.message_id,c,q),await R(e,t.id),new Response("ok")}return s==="help"?(await B(e,r,t.message.message_id,`\u26A1\uFE0F <b>Aether Panel Bot</b>

\u0628\u0627 \u0627\u06CC\u0646 \u0631\u0628\u0627\u062A \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC \u067E\u0646\u0644 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC VLESS/Trojan/VMess \u0631\u0648\u06CC Cloudflare Worker \u0628\u0633\u0627\u0632\u06CC.

\u2022 <b>\u062B\u0628\u062A \u062D\u0633\u0627\u0628</b>: \u06CC\u06A9 API Token \u0645\u06CC\u200C\u062F\u0647\u06CC\u060C \u0631\u0628\u0627\u062A \u062F\u0631 \u062D\u0627\u0641\u0638\u0647\u200C\u0627\u0634 \u0646\u06AF\u0647 \u0645\u06CC\u200C\u062F\u0627\u0631\u062F.
\u2022 <b>\u0633\u0627\u062E\u062A \u067E\u0646\u0644</b>: \u0631\u0628\u0627\u062A \u0631\u0648\u06CC \u0647\u0631 \u062D\u0633\u0627\u0628 \u06A9\u0647 \u0628\u062E\u0648\u0627\u0647\u06CC \u06CC\u06A9 \u0648\u0631\u06A9\u0631 + D1 + KV \u0645\u06CC\u200C\u0633\u0627\u0632\u062F \u0648 \u0644\u06CC\u0646\u06A9 \u067E\u0646\u0644 \u0631\u0627 \u0645\u06CC\u200C\u062F\u0647\u062F.
\u2022 <b>\u0622\u067E\u062F\u06CC\u062A</b>: \u0633\u0648\u0631\u0633 \u062C\u062F\u06CC\u062F \u0631\u0627 \u0627\u0632 \u06AF\u06CC\u062A\u0647\u0627\u0628 \u0631\u0648\u06CC \u0647\u0645\u0627\u0646 \u0648\u0631\u06A9\u0631 \u062F\u06CC\u067E\u0644\u0648\u06CC \u0645\u06CC\u200C\u06A9\u0646\u062F.
\u2022 <b>\u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0631\u0645\u0632</b>: \u0631\u0645\u0632 \u0627\u0648\u0644\u06CC\u0647 \u0631\u0627 \u0646\u0645\u0627\u06CC\u0634 \u0645\u06CC\u200C\u062F\u0647\u062F.

\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC: @nikzadcr`,q),await R(e,t.id),new Response("ok")):s==="home"?(await B(e,r,t.message.message_id,`\u{1F3E0} <b>\u0645\u0646\u0648\u06CC \u0627\u0635\u0644\u06CC</b>
\u06CC\u06A9\u06CC \u0627\u0632 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646:`,q),await R(e,t.id),new Response("ok")):(await R(e,t.id),new Response("ok"))}async function ln(t,e){let r=(t.text||"").trim(),n=t.chat.id;if(r==="/start"||r==="/menu")return await Ye(e,n),await M(e,n,`\u{1F3E0} <b>\u0645\u0646\u0648\u06CC \u0627\u0635\u0644\u06CC</b>
\u06CC\u06A9\u06CC \u0627\u0632 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646:`,{reply_markup:q}),new Response("ok");if(r==="/cancel"||r==="/stop")return await Ye(e,n),await M(e,n,"\u0644\u063A\u0648 \u0634\u062F.",{reply_markup:q}),new Response("ok");let s=await Y(e,n)||{};if(s.step==="awaiting_token"&&s.awaiting==="register"){if(!/^[A-Za-z0-9_\-]{30,}$/.test(r))return await M(e,n,"\u274C \u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u062F\u0648\u0628\u0627\u0631\u0647 \u0628\u0641\u0631\u0633\u062A \u06CC\u0627 /cancel \u0628\u0632\u0646."),new Response("ok");await M(e,n,"\u{1F511} \u062A\u0648\u06A9\u0646 \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F\u060C \u062F\u0631 \u062D\u0627\u0644 \u0627\u0639\u062A\u0628\u0627\u0631\u0633\u0646\u062C\u06CC...");try{let o=await(await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify",{headers:{Authorization:"Bearer "+r}})).json();if(!o.success)throw new Error(o.errors?.[0]?.message||"\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631");let c=await(await fetch("https://api.cloudflare.com/client/v4/accounts",{headers:{Authorization:"Bearer "+r}})).json();if(!c.result?.length)throw new Error(c.errors?.[0]?.message||"\u062D\u0633\u0627\u0628\u06CC \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F");let l=c.result[0],d={id:Math.random().toString(36).slice(2,8),name:l.name,token:r},u={accounts:[...s.accounts||[],d]};await Nt(e,n,u),await M(e,n,"\u2705 \u062D\u0633\u0627\u0628 <b>"+yt(l.name)+`</b> \u062B\u0628\u062A \u0634\u062F.
\u062D\u0627\u0644\u0627 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC \u067E\u0646\u0644 \u0628\u0633\u0627\u0632\u06CC.`,{reply_markup:q})}catch(a){await M(e,n,"\u274C \u062E\u0637\u0627: "+yt(a.message)+`
\u062A\u0648\u06A9\u0646 \u0631\u0627 \u0686\u06A9 \u06A9\u0646.`)}return new Response("ok")}return await M(e,n,"\u06CC\u06A9\u06CC \u0627\u0632 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u0645\u0646\u0648 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646:",{reply_markup:q}),new Response("ok")}async function dn(t,e,r,n){let s=await M(t,e,"\u{1F680} \u062F\u0631 \u062D\u0627\u0644 \u0633\u0627\u062E\u062A \u067E\u0646\u0644 \u0631\u0648\u06CC \u062D\u0633\u0627\u0628 <b>"+yt(r.name)+`</b>...
\u0627\u06CC\u0646 \u06A9\u0627\u0631 \u062D\u062F\u0648\u062F \u06F3\u06F0 \u062B\u0627\u0646\u06CC\u0647 \u0637\u0648\u0644 \u0645\u06CC\u200C\u06A9\u0634\u062F.`);try{let a=await Je({token:r.token}),o=await Y(t,e)||{accounts:[]},i=o.accounts.findIndex(c=>c.id===r.id);i>=0&&(o.accounts[i]={...r,worker:a.workerName,panel:a.url+"/panel",admin:a.adminPassword},await Nt(t,e,o)),await B(t,{id:e},s,`\u2705 <b>\u067E\u0646\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0633\u0627\u062E\u062A\u0647 \u0634\u062F!</b>

\u{1F517} \u067E\u0646\u0644: `+a.url+`/panel
\u{1F464} \u06A9\u0627\u0631\u0628\u0631: <code>`+a.adminUser+`</code>
\u{1F511} \u0631\u0645\u0632: <code>`+a.adminPassword+`</code>

\u{1F4F2} \u0627\u0634\u062A\u0631\u0627\u06A9 \u062A\u0633\u062A: `+a.url+`/sub/test

\u067E\u0633 \u0627\u0632 \u0648\u0631\u0648\u062F\u060C \u0631\u0645\u0632 \u0631\u0627 \u0639\u0648\u0636 \u06A9\u0646 \u0648 \u06A9\u0627\u0631\u0628\u0631\u0647\u0627\u06CC\u062A \u0631\u0627 \u0628\u0633\u0627\u0632.`,{reply_markup:q})}catch(a){await B(t,{id:e},s,`\u274C \u062E\u0637\u0627 \u062F\u0631 \u0633\u0627\u062E\u062A \u067E\u0646\u0644:
`+yt(a.message))}}async function un(t,e,r,n){}async function Y(t,e){try{let r=await t.KV.get("tgstate:"+e);return r?JSON.parse(r):null}catch{return null}}async function Nt(t,e,r){await t.KV.put("tgstate:"+e,JSON.stringify(r),{expirationTtl:60*60*24*30})}async function Ye(t,e){await t.KV.delete("tgstate:"+e)}function $t(t,e,r){return fetch("https://api.telegram.org/bot"+t+"/"+e,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(r)})}async function M(t,e,r,n={}){let a=await(await $t(t.TELEGRAM_TOKEN,"sendMessage",{chat_id:e,text:r,parse_mode:"HTML",disable_web_page_preview:!0,...n})).json();return a.ok&&a.result?a.result.message_id:0}async function B(t,e,r,n,s={}){if(!r){await M(t,e.id,n,s);return}await $t(t.TELEGRAM_TOKEN,"editMessageText",{chat_id:e.id,message_id:r,text:n,parse_mode:"HTML",disable_web_page_preview:!0,...s})}async function R(t,e,r,n){await $t(t.TELEGRAM_TOKEN,"answerCallbackQuery",{callback_query_id:e,text:r,show_alert:!!n})}function yt(t){return t.replace(/[&<>]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[e])}function Xe(){return`<!doctype html><html lang="fa" dir="rtl"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>Aether \u2014 \u0648\u0631\u0648\u062F</title>
<link rel="icon" href="/icon.svg"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"/>
<script src="https://cdn.tailwindcss.com"><\/script>
<style>
  body{font-family:Vazirmatn,system-ui;background:#000;color:#e5e7eb;min-height:100vh}
  .bg-grid{background:radial-gradient(ellipse at top right,rgba(34,211,238,.15),transparent 60%),radial-gradient(ellipse at bottom left,rgba(139,92,246,.12),transparent 60%),#000}
  .glass{background:rgba(10,12,20,.72);backdrop-filter:blur(18px);border:1px solid rgba(148,163,184,.1)}
  .input{background:#0a0c14;border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:12px 14px;color:#e5e7eb;width:1px;min-width:100%;transition:.15s}
  .input:focus{outline:none;border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.15)}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;padding:10px 16px;font-weight:600;transition:.15s;cursor:pointer;border:none}
  .btn-primary{background:linear-gradient(135deg,#22d3ee,#0ea5e9);color:#00131c}
  .btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px)}
  .logo-pulse{animation:pulse 2.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{filter:drop-shadow(0 0 12px rgba(34,211,238,.4))}50%{filter:drop-shadow(0 0 24px rgba(34,211,238,.7))}}
  .float{animation:float 6s ease-in-out infinite}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
</style></head>
<body class="bg-grid grid place-items-center p-4">
<div class="w-full max-w-md">
  <div class="text-center mb-8 float">
    <div class="inline-block logo-pulse">
      <img src="/icon.svg" class="w-20 h-20 mx-auto" alt="Aether"/>
    </div>
    <h1 class="text-3xl font-black mt-4 bg-gradient-to-l from-cyan-300 to-sky-500 bg-clip-text text-transparent">AETHER PANEL</h1>
    <p class="text-slate-400 text-sm mt-1">Cloudflare Worker \xB7 D1 \xB7 Durable Objects</p>
  </div>
  <div class="glass rounded-3xl p-8 shadow-2xl shadow-cyan-500/5">
    <h2 class="text-lg font-bold mb-1">\u0648\u0631\u0648\u062F \u0628\u0647 \u067E\u0646\u0644</h2>
    <p class="text-xs text-slate-400 mb-6">\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u062F\u0645\u06CC\u0646 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F</p>
    <form id="f" class="space-y-4">
      <div>
        <label class="text-xs text-slate-400 mb-1.5 block">\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC</label>
        <input id="u" class="input" autocomplete="username" placeholder="admin" required>
      </div>
      <div>
        <label class="text-xs text-slate-400 mb-1.5 block">\u0631\u0645\u0632 \u0639\u0628\u0648\u0631</label>
        <input id="p" type="password" class="input" autocomplete="current-password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" required>
      </div>
      <button class="btn btn-primary w-full py-3 text-base">\u0648\u0631\u0648\u062F \u0628\u0647 \u067E\u0646\u0644 \u2192</button>
      <p id="err" class="text-rose-400 text-sm text-center min-h-[1.25rem]"></p>
    </form>
  </div>
  <p class="text-center text-slate-600 text-xs mt-6">Aether Panel v0.1 \xB7 MIT licensed</p>
</div>
<script>
f.addEventListener('submit', async function(e){
  e.preventDefault();
  err.textContent = '';
  var btn = f.querySelector('button');
  btn.disabled = true; btn.textContent = '\u062F\u0631 \u062D\u0627\u0644 \u0648\u0631\u0648\u062F...';
  try {
    var r = await fetch('/api/auth/login', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({username:u.value, password:p.value})});
    if (r.ok) location.href = '/panel';
    else { var j = await r.json().catch(function(){return {}}); err.textContent = j.error || '\u0648\u0631\u0648\u062F \u0646\u0627\u0645\u0648\u0641\u0642'; }
  } catch(ex) { err.textContent = '\u062E\u0637\u0627\u06CC \u0634\u0628\u06A9\u0647'; }
  btn.disabled = false; btn.textContent = '\u0648\u0631\u0648\u062F \u0628\u0647 \u067E\u0646\u0644 \u2192';
});
<\/script></body></html>`}function Ze(t,e=!1){return`<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>Aether Panel</title>
<link rel="icon" href="/icon.svg"/>
<link rel="manifest" href="/manifest.json"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"/>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"><\/script>
<style>
  :root {
    --bg: #000000;
    --panel: #0a0c14;
    --panel-2: #0f1320;
    --border: rgba(148,163,184,.12);
    --border-strong: rgba(148,163,184,.22);
    --text: #e5e7eb;
    --muted: #64748b;
    --cyan: #22d3ee;
    --sky: #0ea5e9;
    --emerald: #10b981;
    --rose: #f43f5e;
    --amber: #f59e0b;
    --violet: #8b5cf6;
  }
  * { box-sizing: border-box; }
  html,body { margin:0; padding:0; font-family:Vazirmatn,system-ui,sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
  body { background:
    radial-gradient(ellipse 80% 50% at 100% -10%, rgba(34,211,238,.10), transparent 60%),
    radial-gradient(ellipse 60% 50% at 0% 100%, rgba(139,92,246,.08), transparent 60%),
    #000;
  }
  .glass { background:rgba(10,12,20,.72); backdrop-filter:blur(20px); border:1px solid var(--border); }
  .sidebar { background:linear-gradient(180deg,rgba(10,12,20,.95),rgba(5,7,14,.95)); border-left:1px solid var(--border); }
  .nav-item { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:12px; color:#94a3b8; cursor:pointer; transition:.15s; font-size:14px; font-weight:500; }
  .nav-item:hover { background:rgba(34,211,238,.06); color:#e5e7eb; }
  .nav-item.active { background:linear-gradient(135deg,rgba(34,211,238,.18),rgba(14,165,233,.08)); color:#67e8f9; box-shadow:inset 0 0 0 1px rgba(34,211,238,.25); }
  .stat-card { position:relative; overflow:hidden; border-radius:18px; padding:18px; border:1px solid var(--border); background:linear-gradient(135deg,var(--panel),var(--panel-2)); transition:.2s; }
  .stat-card:hover { transform:translateY(-2px); border-color:var(--border-strong); }
  .stat-card .ic { width:42px; height:42px; border-radius:12px; display:grid; place-items:center; }
  .stat-card .val { font-size:26px; font-weight:800; margin-top:10px; letter-spacing:-.5px; }
  .stat-card .lbl { font-size:12px; color:var(--muted); margin-top:2px; }
  .stat-card::after { content:''; position:absolute; inset:-40% -40% auto auto; width:140px; height:140px; border-radius:50%; opacity:.25; filter:blur(40px); }
  .stat-card.cyan::after { background:#22d3ee; }
  .stat-card.emerald::after { background:#10b981; }
  .stat-card.violet::after { background:#8b5cf6; }
  .stat-card.amber::after { background:#f59e0b; }

  .btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:9px 14px; border-radius:11px; font-weight:600; font-size:13px; cursor:pointer; border:1px solid transparent; transition:.15s; white-space:nowrap; font-family:inherit; }
  .btn:hover { transform:translateY(-1px); }
  .btn:active { transform:translateY(0); }
  .btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
  .btn-primary { background:linear-gradient(135deg,#22d3ee,#0ea5e9); color:#00131c; box-shadow:0 4px 20px -6px rgba(34,211,238,.5); }
  .btn-violet { background:linear-gradient(135deg,#8b5cf6,#6d28d9); color:#fff; }
  .btn-emerald { background:linear-gradient(135deg,#10b981,#059669); color:#fff; }
  .btn-rose { background:linear-gradient(135deg,#f43f5e,#be123c); color:#fff; }
  .btn-amber { background:linear-gradient(135deg,#f59e0b,#d97706); color:#1a1200; }
  .btn-ghost { background:rgba(148,163,184,.06); color:#cbd5e1; border-color:var(--border); }
  .btn-ghost:hover { background:rgba(148,163,184,.12); }
  .btn-icon { padding:8px; width:34px; height:34px; }

  .input, select, textarea { background:#070911; border:1px solid var(--border); border-radius:11px; padding:10px 12px; color:var(--text); font-family:inherit; font-size:13px; width:100%; transition:.15s; }
  .input:focus, select:focus, textarea:focus { outline:none; border-color:#22d3ee; box-shadow:0 0 0 3px rgba(34,211,238,.12); }
  .input::placeholder { color:#475569; }
  label.field { display:block; margin-bottom:12px; }
  label.field > span { display:block; font-size:11px; color:var(--muted); margin-bottom:5px; font-weight:500; }

  table { width:100%; border-collapse:separate; border-spacing:0; }
  th { text-align:right; padding:12px 14px; font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; background:rgba(148,163,184,.03); border-bottom:1px solid var(--border); }
  td { padding:13px 14px; font-size:13px; border-bottom:1px solid rgba(148,163,184,.06); vertical-align:middle; }
  tr:hover td { background:rgba(34,211,238,.025); }
  .user-cell { display:flex; align-items:center; gap:10px; }
  .avatar { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; font-weight:700; font-size:13px; color:#00131c; flex-shrink:0; }
  .mono { font-family:ui-monospace,'SF Mono',Menlo,monospace; direction:ltr; text-align:left; display:inline-block; }
  .chip { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:999px; font-size:10.5px; font-weight:600; }
  .chip-green { background:rgba(16,185,129,.12); color:#34d399; }
  .chip-red { background:rgba(244,63,94,.12); color:#fb7185; }
  .chip-cyan { background:rgba(34,211,238,.1); color:#67e8f9; }
  .chip-violet { background:rgba(139,92,246,.12); color:#a78bfa; }
  .chip-amber { background:rgba(245,158,11,.12); color:#fbbf24; }
  .chip-slate { background:rgba(148,163,184,.1); color:#94a3b8; }
  .progress { height:6px; background:rgba(148,163,184,.1); border-radius:999px; overflow:hidden; min-width:90px; }
  .progress > i { display:block; height:100%; border-radius:999px; background:linear-gradient(90deg,#22d3ee,#0ea5e9); transition:width .3s; }
  .progress.warn > i { background:linear-gradient(90deg,#f59e0b,#d97706); }
  .progress.danger > i { background:linear-gradient(90deg,#f43f5e,#be123c); }

  .switch { position:relative; display:inline-block; width:40px; height:22px; }
  .switch input { opacity:0; width:0; height:0; }
  .switch .slider { position:absolute; cursor:pointer; inset:0; background:#1e293b; border-radius:999px; transition:.2s; }
  .switch .slider::before { content:''; position:absolute; width:16px; height:16px; right:3px; top:3px; background:#fff; border-radius:50%; transition:.2s; }
  .switch input:checked + .slider { background:linear-gradient(135deg,#22d3ee,#0ea5e9); }
  .switch input:checked + .slider::before { transform:translateX(-18px); }

  .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.7); backdrop-filter:blur(6px); display:none; align-items:flex-start; justify-content:center; padding:40px 16px; z-index:50; overflow-y:auto; }
  .modal-backdrop.open { display:flex; }
  .modal { background:linear-gradient(180deg,#0c1020,#070a13); border:1px solid var(--border-strong); border-radius:20px; width:100%; max-width:680px; box-shadow:0 30px 80px -20px rgba(0,0,0,.8); animation:pop .2s ease; }
  @keyframes pop { from { opacity:0; transform:translateY(8px) scale(.98);} to {opacity:1; transform:none;} }
  .modal-head { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .modal-body { padding:22px 24px; max-height:70vh; overflow-y:auto; }
  .modal-foot { padding:16px 24px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:8px; }

  .toast-wrap { position:fixed; left:20px; bottom:20px; z-index:100; display:flex; flex-direction:column; gap:8px; }
  .toast { padding:12px 18px; border-radius:12px; font-size:13px; font-weight:600; box-shadow:0 10px 30px -8px rgba(0,0,0,.6); animation:slidein .25s ease; display:flex; align-items:center; gap:8px; max-width:360px; }
  @keyframes slidein { from { opacity:0; transform:translateY(10px) translateX(-20px);} to {opacity:1; transform:none;} }
  .toast.success { background:linear-gradient(135deg,#10b981,#059669); color:#fff; }
  .toast.error { background:linear-gradient(135deg,#f43f5e,#be123c); color:#fff; }
  .toast.info { background:linear-gradient(135deg,#0ea5e9,#0369a1); color:#fff; }

  .section-title { font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.6px; margin:18px 0 10px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width: 768px) {
    .sidebar { position: fixed; right: 0; top: 0; bottom: 0; z-index: 60; transform: translateX(100%); transition: transform .25s ease; width: 260px; }
    .sidebar.open { transform: translateX(0); }
    .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 55; display: none; }
    .sidebar-overlay.open { display: block; }
    main { padding: 14px !important; }
    .stat-card { padding: 14px; border-radius: 14px; }
    .stat-card .val { font-size: 20px; }
    .stat-card .ic { width: 36px; height: 36px; }
    th, td { padding: 10px 8px; font-size: 12px; }
    td .avatar { width: 28px; height: 28px; font-size: 11px; }
    .modal { margin: 10px; border-radius: 16px; }
    .modal-body { padding: 16px; max-height: 75vh; }
    .modal-head { padding: 14px 16px; }
    .modal-foot { padding: 12px 16px; }
    .grid2 { grid-template-columns: 1fr; }
    .copy-link { font-size: 10px; }
    header { gap: 8px !important; margin-bottom: 16px !important; }
    .search-box { max-width: none !important; }
    #btn-new span { display: none; }
    .btn { padding: 8px 12px; font-size: 12px; }
    h1 { font-size: 18px !important; }
    .toast-wrap { left: 12px; right: 12px; bottom: 12px; }
    .toast { max-width: none; font-size: 12px; }
    .progress { min-width: 60px; }
  }
  @media (min-width: 769px) {
    .mobile-show { display: none !important; }
  }
  .mobile-show { display:none; }
  .search-box { position:relative; }
  .search-box input { padding-right:38px; }
  .search-box svg { position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; }
  .qr-box { background:#fff; padding:14px; border-radius:14px; display:inline-block; }
  .qr-box img, .qr-box canvas { display:block; }
  .copy-link { font-family:ui-monospace,monospace; font-size:11px; direction:ltr; text-align:left; background:#070911; border:1px solid var(--border); padding:10px; border-radius:9px; word-break:break-all; max-height:80px; overflow-y:auto; }
  .tab { padding:8px 14px; border-radius:9px; font-size:12px; font-weight:600; color:var(--muted); cursor:pointer; border:1px solid transparent; }
  .tab.active { background:rgba(34,211,238,.1); color:#67e8f9; border-color:rgba(34,211,238,.25); }
  .pulse-dot { width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 0 0 rgba(16,185,129,.6); animation:pulseD 2s infinite; }
  @keyframes pulseD { 0%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}70%{box-shadow:0 0 0 8px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)} }
  .scrollbar::-webkit-scrollbar { width:8px; height:8px; }
  .scrollbar::-webkit-scrollbar-thumb { background:rgba(148,163,184,.2); border-radius:99px; }
  .scrollbar::-webkit-scrollbar-track { background:transparent; }
  .empty { text-align:center; padding:50px 20px; color:var(--muted); }
  .empty svg { margin:0 auto 12px; opacity:.4; }
  .kbd { font-family:ui-monospace,monospace; font-size:10px; background:rgba(148,163,184,.1); padding:2px 6px; border-radius:5px; border:1px solid var(--border); }
</style>
</head>
<body>

<!-- ===== BOOTSTRAP (first admin) ===== -->
<div id="bootstrap" class="min-h-screen grid place-items-center p-4" style="display:none">
  <div class="glass rounded-3xl p-8 w-full max-w-md">
    <div class="text-center mb-6">
      <img src="/icon.svg" class="w-16 h-16 mx-auto mb-3" alt=""/>
      <h1 class="text-2xl font-black bg-gradient-to-l from-cyan-300 to-sky-500 bg-clip-text text-transparent">\u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC Aether</h1>
      <p class="text-sm text-slate-400 mt-1">\u0627\u0648\u0644\u06CC\u0646 \u0627\u062F\u0645\u06CC\u0646 \u0631\u0627 \u0628\u0633\u0627\u0632</p>
    </div>
    <div class="space-y-3">
      <input id="setup-user" class="input" placeholder="\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0645\u062F\u06CC\u0631"/>
      <input id="setup-pass" type="password" class="input" placeholder="\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 (\u062D\u062F\u0627\u0642\u0644 \u06F8 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631)"/>
      <button id="setup-btn" class="btn btn-primary w-full py-3">\u0627\u06CC\u062C\u0627\u062F \u0645\u062F\u06CC\u0631 \u0648 \u0648\u0631\u0648\u062F</button>
    </div>
  </div>
</div>

<!-- ===== APP SHELL ===== -->
<div id="app" class="flex min-h-screen" style="display:none">
  <div id="sidebar-overlay" class="sidebar-overlay"></div>
  <!-- Sidebar -->
  <aside id="sidebar" class="sidebar w-64 flex-shrink-0 p-4 flex flex-col" style="position:sticky;top:0;height:100vh">
    <div class="flex items-center gap-3 px-2 py-3 mb-6">
      <img src="/icon.svg" class="w-10 h-10" alt=""/>
      <div>
        <div class="font-black text-lg leading-tight bg-gradient-to-l from-cyan-300 to-sky-500 bg-clip-text text-transparent">AETHER</div>
        <div class="text-[10px] text-slate-500 font-mono">v${t}</div>
      </div>
    </div>
    <nav class="space-y-1 flex-1">
      <div class="nav-item active" data-view="dashboard">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
        \u062F\u0627\u0634\u0628\u0648\u0631\u062F
      </div>
      <div class="nav-item" data-view="users">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        \u06A9\u0627\u0631\u0628\u0631\u0627\u0646
      </div>
      <div class="nav-item" data-view="proxies">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        \u0627\u0633\u062A\u062E\u0631 \u067E\u0631\u0648\u06A9\u0633\u06CC
      </div>
      <div class="nav-item" data-view="settings">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        \u062A\u0646\u0638\u06CC\u0645\u0627\u062A
      </div>
    </nav>
    <div class="glass rounded-xl p-3 mt-auto">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-sky-600 grid place-items-center text-slate-900 font-bold text-sm" id="me-avatar">A</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold truncate" id="me-name">\u2014</div>
          <div class="text-[10px] text-slate-400" id="me-role">\u2014</div>
        </div>
        <button id="btn-logout" class="btn btn-icon btn-ghost" title="\u062E\u0631\u0648\u062C">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </div>
  </aside>

  <!-- Main -->
  <main class="flex-1 p-5 md:p-8 max-w-full overflow-hidden">
    <!-- Top bar -->
    <header class="flex items-center gap-3 mb-7 flex-wrap">
      <button class="btn btn-ghost btn-icon mobile-show" id="btn-mob-menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div class="search-box flex-1 max-w-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="search" class="input" placeholder="\u062C\u0633\u062A\u062C\u0648\u06CC \u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627 UUID..."/>
      </div>
      <div class="flex items-center gap-2 mr-auto">
        <span class="hidden md:flex items-center gap-2 text-xs text-slate-400 glass rounded-xl px-3 py-2">
          <span class="pulse-dot"></span> \u0622\u0646\u0644\u0627\u06CC\u0646
        </span>
        <button id="btn-new" class="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          \u06A9\u0627\u0631\u0628\u0631 \u062C\u062F\u06CC\u062F
        </button>
      </div>
    </header>

    <!-- DASHBOARD -->
    <section data-page="dashboard">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card cyan">
          <div class="ic" style="background:rgba(34,211,238,.15);color:#67e8f9">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="val" id="stat-users">\u2014</div>
          <div class="lbl">\u06A9\u0644 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646</div>
        </div>
        <div class="stat-card emerald">
          <div class="ic" style="background:rgba(16,185,129,.15);color:#34d399">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="val" id="stat-active">\u2014</div>
          <div class="lbl">\u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0641\u0639\u0627\u0644</div>
        </div>
        <div class="stat-card violet">
          <div class="ic" style="background:rgba(139,92,246,.15);color:#a78bfa">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <div class="val" id="stat-gb">\u2014</div>
          <div class="lbl">\u0645\u0635\u0631\u0641 \u06A9\u0644</div>
        </div>
        <div class="stat-card amber">
          <div class="ic" style="background:rgba(245,158,11,.15);color:#fbbf24">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="val" id="stat-req">\u2014</div>
          <div class="lbl">\u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627</div>
        </div>
      </div>

      <div class="glass rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b" style="border-color:var(--border)">
          <div>
            <h2 class="font-bold">\u0622\u062E\u0631\u06CC\u0646 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646</h2>
            <p class="text-xs text-slate-400 mt-0.5">\u0628\u0631\u0627\u06CC \u0645\u062F\u06CC\u0631\u06CC\u062A \u0647\u0645\u0647 \u0628\u0647 \u062A\u0628 \xAB\u06A9\u0627\u0631\u0628\u0631\u0627\u0646\xBB \u0628\u0631\u0648\u06CC\u062F</p>
          </div>
          <button class="btn btn-ghost" onclick="go('users')">\u0647\u0645\u0647 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u2190</button>
        </div>
        <div class="overflow-x-auto" id="recent-users"></div>
      </div>
    </section>

    <!-- USERS -->
    <section data-page="users" style="display:none">
      <div class="glass rounded-2xl overflow-hidden">
        <div class="flex flex-wrap items-center gap-2 p-4 border-b" style="border-color:var(--border)">
          <div class="flex gap-2 flex-wrap" id="bulk-bar" style="display:none">
            <button class="btn btn-emerald" data-bulk="enable">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              \u0641\u0639\u0627\u0644\u200C\u0633\u0627\u0632\u06CC
            </button>
            <button class="btn btn-amber" data-bulk="disable">\u063A\u06CC\u0631\u0641\u0639\u0627\u0644</button>
            <button class="btn btn-ghost" data-bulk="resetVol">\u0631\u06CC\u0633\u062A \u062D\u062C\u0645</button>
            <button class="btn btn-rose" data-bulk="delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              \u062D\u0630\u0641
            </button>
            <span class="text-xs text-slate-400 self-center" id="sel-count"></span>
          </div>
          <div class="mr-auto flex items-center gap-2">
            <span class="text-xs text-slate-400" id="users-count">\u06F0 \u06A9\u0627\u0631\u0628\u0631</span>
            <button id="btn-refresh" class="btn btn-ghost btn-icon" title="\u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
        </div>
        <div class="overflow-x-auto scrollbar" id="users-table"></div>
      </div>
    </section>

    <!-- PROXIES -->
    <section data-page="proxies" style="display:none">
      <div class="glass rounded-2xl p-5 mb-4">
        <h2 class="font-bold mb-1">\u0627\u0641\u0632\u0648\u062F\u0646 \u067E\u0631\u0648\u06A9\u0633\u06CC</h2>
        <p class="text-xs text-slate-400 mb-4">\u06CC\u06A9 URL \u0641\u0627\u06CC\u0644 \u0645\u062A\u0646\u06CC \u0644\u06CC\u0633\u062A \u067E\u0631\u0648\u06A9\u0633\u06CC \u0648\u0627\u0631\u062F \u06A9\u0646 (\u0647\u0631 \u062E\u0637 socks5://user:pass@host:port \u06CC\u0627 host:port)</p>
        <div class="flex flex-wrap gap-2">
          <input id="proxy-url" class="input flex-1 min-w-[200px]" placeholder="https://example.com/proxy/US.txt"/>
          <input id="proxy-cc" class="input" style="max-width:120px" placeholder="\u06A9\u062F \u06A9\u0634\u0648\u0631 (US)"/>
          <button id="proxy-import" class="btn btn-primary">\u0627\u06CC\u0645\u067E\u0648\u0631\u062A</button>
          <button id="proxy-health" class="btn btn-ghost">\u0628\u0631\u0631\u0633\u06CC \u0633\u0644\u0627\u0645\u062A</button>
          <button id="proxy-reload" class="btn btn-ghost">\u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC DO</button>
        </div>
        <p class="text-xs text-slate-500 mt-2">\u0628\u0639\u062F \u0627\u0632 \u0627\u06CC\u0645\u067E\u0648\u0631\u062A\u060C \u062F\u0631 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0627\u0631\u0628\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC \xAB\u06A9\u062F \u06A9\u0634\u0648\u0631 \u0627\u0633\u062A\u062E\u0631\xBB \u0631\u0627 \u0633\u062A \u06A9\u0646\u06CC \u062A\u0627 \u0628\u0647\u200C\u0635\u0648\u0631\u062A \u062A\u0635\u0627\u062F\u0641\u06CC \u0627\u0632 \u067E\u0631\u0648\u06A9\u0633\u06CC\u200C\u0647\u0627\u06CC \u0633\u0627\u0644\u0645 \u0622\u0646 \u06A9\u0634\u0648\u0631 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0634\u0648\u062F.</p>
      </div>
      <div class="glass rounded-2xl overflow-hidden">
        <div class="p-4 border-b flex items-center justify-between" style="border-color:var(--border)">
          <h3 class="font-bold">\u067E\u0631\u0648\u06A9\u0633\u06CC\u200C\u0647\u0627</h3>
          <span id="proxy-count" class="text-xs text-slate-400">\u2014</span>
        </div>
        <div class="overflow-x-auto scrollbar" id="proxies-table"></div>
      </div>
    </section>

    <!-- SETTINGS -->
    <section data-page="settings" style="display:none">
      <div class="grid md:grid-cols-2 gap-4">
        <div class="glass rounded-2xl p-5">
          <h3 class="font-bold mb-1">\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC</h3>
          <p class="text-xs text-slate-400 mb-4">\u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631</p>
          <label class="field"><span>\u0631\u0645\u0632 \u0641\u0639\u0644\u06CC</span><input id="cur-pass" type="password" class="input"/></label>
          <label class="field"><span>\u0631\u0645\u0632 \u062C\u062F\u06CC\u062F (\u062D\u062F\u0627\u0642\u0644 \u06F8 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631)</span><input id="new-pass" type="password" class="input"/></label>
          <button id="btn-change-pass" class="btn btn-primary w-full">\u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632</button>
        </div>
        <div class="glass rounded-2xl p-5">
          <h3 class="font-bold mb-1">\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u200C\u06AF\u06CC\u0631\u06CC</h3>
          <p class="text-xs text-slate-400 mb-4">\u062F\u0631\u06CC\u0627\u0641\u062A \u06CC\u0627 \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u06A9\u0627\u0645\u0644 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647</p>
          <div class="flex gap-2 flex-wrap">
            <a href="/api/system/backup" class="btn btn-violet" id="btn-backup">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              \u062F\u0627\u0646\u0644\u0648\u062F \u0628\u06A9\u0627\u067E
            </a>
            <label class="btn btn-ghost cursor-pointer">
              \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0627\u0632 \u0641\u0627\u06CC\u0644
              <input type="file" id="restore-file" accept=".json" style="display:none"/>
            </label>
          </div>
        </div>
        <div class="glass rounded-2xl p-5 md:col-span-2">
          <h3 class="font-bold mb-1">\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0633\u06CC\u0633\u062A\u0645</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
            <div class="p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><div class="text-xs text-slate-400">\u0646\u0633\u062E\u0647</div><div class="font-mono mt-1">${t}</div></div>
            <div class="p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><div class="text-xs text-slate-400">\u0645\u062D\u0644 \u0627\u062C\u0631\u0627</div><div class="font-mono mt-1">Cloudflare</div></div>
            <div class="p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><div class="text-xs text-slate-400">\u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647</div><div class="font-mono mt-1">D1 + DO</div></div>
            <div class="p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><div class="text-xs text-slate-400">\u067E\u0631\u0648\u062A\u06A9\u0644\u200C\u0647\u0627</div><div class="font-mono mt-1">VLESS/Trojan/VMess</div></div>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>

<!-- ===== User Modal ===== -->
<div id="modal-user" class="modal-backdrop">
  <div class="modal">
    <div class="modal-head">
      <div>
        <h3 id="mu-title" class="font-bold text-lg">\u06A9\u0627\u0631\u0628\u0631 \u062C\u062F\u06CC\u062F</h3>
        <p class="text-xs text-slate-400 mt-0.5" id="mu-sub">\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0627\u0631\u0628\u0631 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F</p>
      </div>
      <button class="btn btn-ghost btn-icon" data-close-modal>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body scrollbar">
      <div class="section-title" style="margin-top:0">\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u067E\u0627\u06CC\u0647</div>
      <div class="grid2">
        <label class="field"><span>\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC *</span><input id="f-username" class="input" placeholder="my-user"/></label>
        <label class="field"><span>UUID (\u062E\u0627\u0644\u06CC = \u062A\u0635\u0627\u062F\u0641\u06CC)</span><input id="f-uuid" class="input mono" placeholder="auto"/></label>
      </div>
      <div class="section-title">\u0645\u062D\u062F\u0648\u062F\u06CC\u062A\u200C\u0647\u0627</div>
      <div class="grid2">
        <label class="field"><span>\u062D\u062C\u0645 (GB)</span><input id="f-limitGb" type="number" step="0.1" class="input" placeholder="\u0645\u062B\u0644\u0627\u064B 10"/></label>
        <label class="field"><span>\u0627\u0646\u0642\u0636\u0627 (\u0631\u0648\u0632)</span><input id="f-expiryDays" type="number" class="input" placeholder="30"/></label>
        <label class="field"><span>\u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u062F\u0631\u062E\u0648\u0627\u0633\u062A</span><input id="f-limitReq" type="number" class="input" placeholder="\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC"/></label>
        <label class="field"><span>\u062D\u062F\u0627\u06A9\u062B\u0631 \u062F\u0633\u062A\u06AF\u0627\u0647 \u0647\u0645\u0632\u0645\u0627\u0646</span><input id="f-ipLimit" type="number" class="input" placeholder="\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC"/></label>
      </div>
      <div class="section-title">\u0627\u062A\u0635\u0627\u0644</div>
      <div class="grid2">
        <label class="field"><span>\u067E\u0631\u0648\u062A\u06A9\u0644</span>
          <select id="f-connectionType" class="input">
            <option value="vless+trojan">VLESS + Trojan (\u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u06CC)</option>
            <option value="vless">\u0641\u0642\u0637 VLESS</option>
            <option value="trojan">\u0641\u0642\u0637 Trojan</option>
            <option value="vmess">VMess</option>
            <option value="vless+trojan+vmess">\u0647\u0631 \u0633\u0647</option>
          </select>
        </label>
        <label class="field"><span>\u067E\u0648\u0631\u062A</span>
          <select id="f-port" class="input">
            <option value="443">443</option>
            <option value="8443">8443</option>
            <option value="2053">2053</option>
            <option value="2083">2083</option>
            <option value="2087">2087</option>
            <option value="2096">2096</option>
            <option value="80">80 (\u0628\u062F\u0648\u0646 TLS)</option>
            <option value="8080">8080 (\u0628\u062F\u0648\u0646 TLS)</option>
          </select>
        </label>
        <label class="field"><span>\u0645\u0633\u06CC\u0631 (Path)</span><input id="f-path" class="input mono" placeholder="/" value="/"/></label>
        <label class="field"><span>Fingerprint</span>
          <select id="f-fingerprint" class="input">
            <option value="chrome">chrome</option>
            <option value="firefox">firefox</option>
            <option value="safari">safari</option>
            <option value="ios">ios</option>
            <option value="android">android</option>
            <option value="edge">edge</option>
            <option value="random">random</option>
            <option value="unsafe">unsafe</option>
          </select>
        </label>
        <label class="field" style="grid-column:1/-1"><span>SNI / Host (\u062E\u0627\u0644\u06CC = \u0647\u0627\u0633\u062A \u0648\u0631\u06A9\u0631)</span><input id="f-sniHost" class="input" placeholder="example.com"/></label>
        <label class="field" style="grid-column:1/-1"><span>Fragment \u0645\u062B\u0644 200-3000,1-2,tlshello</span><input id="f-fragment" class="input mono" placeholder="\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC"/></label>
      </div>
      <div class="section-title">\u0645\u0633\u06CC\u0631\u06CC\u0627\u0628\u06CC \u0648 \u0641\u06CC\u0644\u062A\u0631 \u0645\u062D\u062A\u0648\u0627</div>
      <div class="grid2">
        <label class="field"><span>\u06A9\u062F \u06A9\u0634\u0648\u0631 \u0627\u0633\u062A\u062E\u0631 \u067E\u0631\u0648\u06A9\u0633\u06CC (\u0645\u062B\u0644 US)</span><input id="f-userProxyIata" class="input mono" placeholder="\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC"/></label>
        <label class="field"><span>\u067E\u0631\u0648\u06A9\u0633\u06CC \u0628\u0627\u0644\u0627\u062F\u0633\u062A \u062F\u0633\u062A\u06CC</span><input id="f-userSocks5" class="input mono" placeholder="socks5://u:p@host:port"/></label>
        <label class="field" style="grid-column:1/-1"><span>\u062F\u0627\u0645\u0646\u0647\u200C\u0647\u0627\u06CC \u0645\u0633\u062A\u0642\u06CC\u0645 (\u0628\u0627 \u06A9\u0627\u0645\u0627)</span><input id="f-routeDirect" class="input" placeholder="example.ir, domain.com"/></label>
        <label class="field" style="grid-column:1/-1"><span>\u062F\u0627\u0645\u0646\u0647\u200C\u0647\u0627\u06CC \u0645\u0633\u062F\u0648\u062F (\u0628\u0627 \u06A9\u0627\u0645\u0627)</span><input id="f-routeBlock" class="input" placeholder="ads.example.com"/></label>
        <label class="field" style="grid-column:1/-1"><span>DoH \u0633\u0641\u0627\u0631\u0634\u06CC</span><input id="f-dohUrl" class="input mono" placeholder="https://cloudflare-dns.com/dns-query"/></label>
      </div>
      <div class="flex flex-wrap gap-5 mt-3">
        <label class="flex items-center gap-2 text-sm cursor-pointer"><span class="switch"><input type="checkbox" id="f-blockPorn"><span class="slider"></span></span>\u0645\u0633\u062F\u0648\u062F\u0633\u0627\u0632\u06CC NSFW</label>
        <label class="flex items-center gap-2 text-sm cursor-pointer"><span class="switch"><input type="checkbox" id="f-blockAds"><span class="slider"></span></span>\u0645\u0633\u062F\u0648\u062F\u0633\u0627\u0632\u06CC \u062A\u0628\u0644\u06CC\u063A</label>
        <label class="flex items-center gap-2 text-sm cursor-pointer"><span class="switch"><input type="checkbox" id="f-blockMalware"><span class="slider"></span></span>\u0628\u062F\u0627\u0641\u0632\u0627\u0631</label>
        <label class="flex items-center gap-2 text-sm cursor-pointer"><span class="switch"><input type="checkbox" id="f-isActive" checked><span class="slider"></span></span>\u06A9\u0627\u0631\u0628\u0631 \u0641\u0639\u0627\u0644</label>
      </div>
      <label class="field mt-4"><span>\u06CC\u0627\u062F\u062F\u0627\u0634\u062A</span><textarea id="f-note" rows="2" class="input" placeholder="\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u062F\u0627\u062E\u0644\u06CC..."></textarea></label>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close-modal>\u0627\u0646\u0635\u0631\u0627\u0641</button>
      <button class="btn btn-primary" id="mu-save">\u0630\u062E\u06CC\u0631\u0647 \u06A9\u0627\u0631\u0628\u0631</button>
    </div>
  </div>
</div>

<!-- ===== Sub Modal (QR + links) ===== -->
<div id="modal-sub" class="modal-backdrop">
  <div class="modal" style="max-width:520px">
    <div class="modal-head">
      <h3 class="font-bold text-lg">\u0627\u0634\u062A\u0631\u0627\u06A9 \u06A9\u0627\u0631\u0628\u0631</h3>
      <button class="btn btn-ghost btn-icon" data-close-modal>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div id="sub-qr" class="flex justify-center mb-4"></div>
      <div class="text-xs text-slate-400 mb-1.5">\u0644\u06CC\u0646\u06A9 \u0627\u0634\u062A\u0631\u0627\u06A9 (\u06A9\u067E\u06CC \u06A9\u0646 \u0648 \u062F\u0631 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u0648\u0627\u0631\u062F \u06A9\u0646):</div>
      <div class="flex gap-2 mb-3">
        <div class="copy-link flex-1" id="sub-url"></div>
        <button class="btn btn-primary" id="sub-copy">\u06A9\u067E\u06CC</button>
      </div>
      <div class="text-xs text-slate-400 mb-1.5">\u0641\u0631\u0645\u062A\u200C\u0647\u0627\u06CC \u062F\u06CC\u06AF\u0631:</div>
      <div class="flex gap-2 flex-wrap mb-3" id="sub-formats"></div>
      <div class="text-xs text-slate-400 mb-1.5">\u0644\u06CC\u0646\u06A9\u200C\u0647\u0627\u06CC \u0645\u0633\u062A\u0642\u06CC\u0645:</div>
      <div class="copy-link" id="sub-raw"></div>
    </div>
  </div>
</div>

<!-- ===== Confirm Modal ===== -->
<div id="modal-confirm" class="modal-backdrop">
  <div class="modal" style="max-width:400px">
    <div class="modal-body text-center py-7">
      <div class="w-14 h-14 mx-auto rounded-full grid place-items-center mb-3" style="background:rgba(244,63,94,.12);color:#fb7185">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h3 class="font-bold text-lg mb-1" id="cf-title">\u0645\u0637\u0645\u0626\u0646\u06CC\u061F</h3>
      <p class="text-sm text-slate-400 mb-5" id="cf-msg"></p>
      <div class="flex gap-2 justify-center">
        <button class="btn btn-ghost" data-close-modal>\u0627\u0646\u0635\u0631\u0627\u0641</button>
        <button class="btn btn-rose" id="cf-ok">\u062A\u0623\u06CC\u06CC\u062F</button>
      </div>
    </div>
  </div>
</div>

<div class="toast-wrap" id="toasts"></div>

<script>
/* ============================================================
   Aether Panel client logic (string concat only \u2014 safe inside
   the outer server template literal).
   ============================================================ */
var API = {
  req: function(method, path, body){
    var opt = { method: method, credentials: 'include', headers: {} };
    if (body !== undefined) { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(body); }
    return fetch(path, opt).then(function(r){
      if (r.status === 401) { location.href = '/login'; throw new Error('unauthorized'); }
      var ct = r.headers.get('content-type') || '';
      var p = ct.indexOf('json') >= 0 ? r.json() : r.text();
      if (!r.ok) return p.then(function(e){ throw new Error((e && e.error) || r.statusText); });
      return p;
    });
  },
  get: function(p){ return API.req('GET', p); },
  post: function(p,b){ return API.req('POST', p, b); },
  patch: function(p,b){ return API.req('PATCH', p, b); },
  del: function(p){ return API.req('DELETE', p); }
};

function toast(msg, type){
  var t = document.createElement('div');
  t.className = 'toast ' + (type || 'success');
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(function(){ t.remove(); }, 250); }, 2800);
}

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function fmtGB(n){ if (n == null) return '\u2014'; return (Number(n)||0).toFixed(2) + ' GB'; }
function fmtNum(n){ return (Number(n)||0).toLocaleString('fa-IR'); }
function fmtDate(ts){ if (!ts) return '\u2014'; try { return new Date(ts*1000).toLocaleString('fa-IR', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); } catch(e){ return '\u2014'; } }
function pct(used, limit){ if (!limit) return 0; return Math.min(100, Math.round((Number(used||0)/Number(limit))*100)); }
function progressClass(p){ if (p >= 90) return 'danger'; if (p >= 70) return 'warn'; return ''; }
function avatarColor(name){
  var colors = ['#22d3ee','#8b5cf6','#f59e0b','#10b981','#f43f5e','#0ea5e9','#ec4899'];
  var h = 0; for (var i=0;i<name.length;i++) h = (h*31 + name.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}
function protoChips(ct){
  var map = { vless:'cyan', trojan:'violet', vmess:'amber' };
  return (ct || 'vless').split('+').map(function(p){
    var cls = map[p] || 'slate';
    return '<span class="chip chip-' + cls + '">' + esc(p.toUpperCase()) + '</span>';
  }).join(' ');
}

var state = { users: [], selected: new Set(), editing: null, view: 'dashboard' };

/* ---------- navigation ---------- */
function go(view){
  state.view = view;
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.toggle('active', n.dataset.view === view); });
  document.querySelectorAll('[data-page]').forEach(function(s){ s.style.display = s.dataset.page === view ? '' : 'none'; });
  if (view === 'dashboard') loadDashboard();
  if (view === 'users') loadUsers();
  if (view === 'proxies') loadProxies();
}
document.querySelectorAll('.nav-item').forEach(function(n){ n.addEventListener('click', function(){
  go(n.dataset.view);
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}); });
document.getElementById('btn-mob-menu')?.addEventListener('click', function(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
});
document.getElementById('sidebar-overlay')?.addEventListener('click', function(){
  document.getElementById('sidebar').classList.remove('open');
  this.classList.remove('open');
});

/* ---------- bootstrap / auth ---------- */
async function boot(){
  try {
    var me = await API.get('/api/auth/me');
    document.getElementById('app').style.display = '';
    document.getElementById('me-name').textContent = me.actor;
    document.getElementById('me-role').textContent = me.role || me.kind;
    document.getElementById('me-avatar').textContent = String(me.actor||'A').charAt(0).toUpperCase();
    await loadDashboard();
  } catch(e){
    document.getElementById('bootstrap').style.display = '';
  }
}
document.getElementById('setup-btn').addEventListener('click', async function(){
  var u = document.getElementById('setup-user').value.trim();
  var p = document.getElementById('setup-pass').value;
  if (!u || p.length < 8) return toast('\u0631\u0645\u0632 \u062D\u062F\u0627\u0642\u0644 \u06F8 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631', 'error');
  try {
    await API.post('/api/auth/setup', { username: u, password: p });
    await API.post('/api/auth/login', { username: u, password: p });
    toast('\u062E\u0648\u0634 \u0622\u0645\u062F\u06CC!');
    location.reload();
  } catch(e){ toast(e.message, 'error'); }
});
document.getElementById('btn-logout').addEventListener('click', async function(){
  await API.post('/api/auth/logout', {}).catch(function(){});
  location.href = '/login';
});
document.getElementById('btn-change-pass').addEventListener('click', async function(){
  var cur = document.getElementById('cur-pass').value;
  var next = document.getElementById('new-pass').value;
  if (next.length < 8) return toast('\u0631\u0645\u0632 \u062C\u062F\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F8 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631', 'error');
  try {
    await API.post('/api/auth/change-password', { current: cur, next: next });
    toast('\u0631\u0645\u0632 \u0639\u0648\u0636 \u0634\u062F');
    document.getElementById('cur-pass').value = '';
    document.getElementById('new-pass').value = '';
  } catch(e){ toast(e.message, 'error'); }
});
document.getElementById('restore-file').addEventListener('change', async function(e){
  var f = e.target.files[0]; if (!f) return;
  confirmDial('\u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0628\u06A9\u0627\u067E', '\u0627\u06CC\u0646 \u0639\u0645\u0644 \u0647\u0645\u0647\u200C\u06CC \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0641\u0639\u0644\u06CC \u0631\u0627 \u0628\u0627\u0632\u0646\u0648\u06CC\u0633\u06CC \u0645\u06CC\u200C\u06A9\u0646\u062F. \u0645\u0637\u0645\u0626\u0646\u06CC\u061F', async function(){
    var text = await f.text();
    var data = JSON.parse(text);
    try {
      var r = await API.post('/api/system/restore', data);
      toast(r.users + ' \u06A9\u0627\u0631\u0628\u0631 \u0648 ' + r.proxies + ' \u067E\u0631\u0648\u06A9\u0633\u06CC \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0634\u062F');
      loadDashboard(); loadUsers();
    } catch(ex){ toast(ex.message, 'error'); }
  });
});

/* ---------- data loaders ---------- */
async function loadStats(){
  try {
    var s = await API.get('/api/stats');
    document.getElementById('stat-users').textContent = fmtNum(s.users);
    document.getElementById('stat-active').textContent = fmtNum(s.active);
    document.getElementById('stat-gb').textContent = (Number(s.usedGb)||0).toFixed(2);
    document.getElementById('stat-req').textContent = fmtNum(s.usedReq);
  } catch(e){}
}
async function loadDashboard(){
  await loadStats();
  try {
    var r = await API.get('/api/users?pageSize=8');
    document.getElementById('recent-users').innerHTML = renderUsersTable(r.users, true);
    wireRows();
  } catch(e){}
}
async function loadUsers(){
  var q = document.getElementById('search').value.trim();
  var r = await API.get('/api/users?pageSize=200' + (q ? '&q=' + encodeURIComponent(q) : ''));
  state.users = r.users || [];
  document.getElementById('users-count').textContent = fmtNum(r.total) + ' \u06A9\u0627\u0631\u0628\u0631';
  document.getElementById('users-table').innerHTML = renderUsersTable(state.users, false);
  document.getElementById('chk-all')?.remove();
  wireRows();
  updateBulkBar();
}
function renderUsersTable(users, compact){
  if (!users || !users.length) {
    return '<div class="empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><div>\u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F</div></div>';
  }
  var head = '';
  if (!compact) {
    head = '<thead><tr>' +
      '<th style="width:36px"><input type="checkbox" id="chk-all"/></th>' +
      '<th>\u06A9\u0627\u0631\u0628\u0631</th><th>\u067E\u0631\u0648\u062A\u06A9\u0644</th><th>\u062D\u062C\u0645</th><th>\u0627\u0646\u0642\u0636\u0627</th>' +
      '<th>\u062F\u0631\u062E\u0648\u0627\u0633\u062A</th><th>\u0648\u0636\u0639\u06CC\u062A</th><th>\u0622\u062E\u0631\u06CC\u0646 \u0627\u062A\u0635\u0627\u0644</th><th></th></tr></thead>';
  } else {
    head = '<thead><tr><th>\u06A9\u0627\u0631\u0628\u0631</th><th>\u067E\u0631\u0648\u062A\u06A9\u0644</th><th>\u062D\u062C\u0645</th><th>\u0648\u0636\u0639\u06CC\u062A</th><th></th></tr></thead>';
  }
  var rows = users.map(function(u){
    var p = pct(u.used_gb, u.limit_gb);
    var color = avatarColor(u.username);
    var actions =
      '<button class="btn btn-ghost btn-icon" data-act="sub" data-u="' + esc(u.username) + '" title="\u0627\u0634\u062A\u0631\u0627\u06A9/QR">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' +
      '</button>' +
      '<button class="btn btn-ghost btn-icon" data-act="edit" data-u="' + esc(u.username) + '" title="\u0648\u06CC\u0631\u0627\u06CC\u0634">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
      '</button>' +
      '<button class="btn btn-ghost btn-icon" style="color:#fb7185" data-act="del" data-u="' + esc(u.username) + '" title="\u062D\u0630\u0641">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>' +
      '</button>';
    var activeChip = u.is_active
      ? '<span class="chip chip-green"><span class="pulse-dot" style="width:6px;height:6px"></span> \u0641\u0639\u0627\u0644</span>'
      : '<span class="chip chip-red">\u063A\u06CC\u0631\u0641\u0639\u0627\u0644</span>';
    var userCell =
      '<div class="user-cell">' +
        '<div class="avatar" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '44">' + esc(String(u.username).charAt(0).toUpperCase()) + '</div>' +
        '<div style="min-width:0">' +
          '<div class="font-semibold truncate">' + esc(u.username) + '</div>' +
          '<div class="text-[10px] text-slate-500 mono truncate">' + esc((u.uuid||'').slice(0,8)) + '\u2026</div>' +
        '</div>' +
      '</div>';
    if (compact) {
      return '<tr><td>' + userCell + '</td><td>' + protoChips(u.connection_type) + '</td>' +
        '<td><div class="flex items-center gap-2"><div class="progress ' + progressClass(p) + '"><i style="width:' + p + '%"></i></div><span class="text-[11px] text-slate-400 whitespace-nowrap">' + fmtGB(u.used_gb) + '/' + (u.limit_gb == null ? '\u221E' : fmtGB(u.limit_gb)) + '</span></div></td>' +
        '<td>' + activeChip + '</td><td><div class="flex gap-1">' + actions + '</div></td></tr>';
    }
    var cb = '<input type="checkbox" data-sel="' + esc(u.username) + '"' + (state.selected.has(u.username) ? ' checked' : '') + '/>';
    return '<tr>' +
      '<td>' + cb + '</td>' +
      '<td>' + userCell + '</td>' +
      '<td>' + protoChips(u.connection_type) + '</td>' +
      '<td><div class="flex items-center gap-2"><div class="progress ' + progressClass(p) + '"><i style="width:' + p + '%"></i></div><span class="text-[11px] text-slate-400 whitespace-nowrap">' + fmtGB(u.used_gb) + '/' + (u.limit_gb == null ? '\u221E' : fmtGB(u.limit_gb)) + '</span></div></td>' +
      '<td>' + (u.expiry_days != null ? u.expiry_days + ' \u0631\u0648\u0632' : '<span class="text-slate-500">\u221E</span>') + '</td>' +
      '<td>' + fmtNum(u.used_req) + (u.limit_req != null ? ' <span class="text-slate-500">/ ' + fmtNum(u.limit_req) + '</span>' : '') + '</td>' +
      '<td>' + activeChip + '</td>' +
      '<td class="text-slate-400 text-xs whitespace-nowrap">' + fmtDate(u.last_active) + '</td>' +
      '<td><div class="flex gap-1">' + actions + '</div></td>' +
    '</tr>';
  }).join('');
  return '<table>' + head + '<tbody>' + rows + '</tbody></table>';
}

function wireRows(){
  document.querySelectorAll('[data-act]').forEach(function(b){
    b.addEventListener('click', function(){
      var act = b.dataset.act, u = b.dataset.u;
      if (act === 'edit') openUserModal(u);
      else if (act === 'del') {
        confirmDial('\u062D\u0630\u0641 \u06A9\u0627\u0631\u0628\u0631', '\u06A9\u0627\u0631\u0628\u0631 \xAB' + u + '\xBB \u0628\u0631\u0627\u06CC \u0647\u0645\u06CC\u0634\u0647 \u062D\u0630\u0641 \u0645\u06CC\u200C\u0634\u0648\u062F. \u0645\u0637\u0645\u0626\u0646\u06CC\u061F', function(){
          API.del('/api/users/' + encodeURIComponent(u)).then(function(){ toast('\u062D\u0630\u0641 \u0634\u062F'); loadUsers(); loadStats(); }).catch(function(e){ toast(e.message,'error'); });
        });
      } else if (act === 'sub') openSubModal(u);
    });
  });
  var chkAll = document.getElementById('chk-all');
  if (chkAll) chkAll.onchange = function(){
    state.users.forEach(function(u){ if (chkAll.checked) state.selected.add(u.username); else state.selected.delete(u.username); });
    loadUsers();
  };
  document.querySelectorAll('[data-sel]').forEach(function(c){
    c.onchange = function(){
      if (c.checked) state.selected.add(c.dataset.sel); else state.selected.delete(c.dataset.sel);
      updateBulkBar();
    };
  });
}
function updateBulkBar(){
  var bar = document.getElementById('bulk-bar');
  if (!bar) return;
  bar.style.display = state.selected.size ? '' : 'none';
  document.getElementById('sel-count').textContent = state.selected.size + ' \u0627\u0646\u062A\u062E\u0627\u0628 \u0634\u062F\u0647';
}
document.querySelectorAll('[data-bulk]').forEach(function(b){
  b.addEventListener('click', function(){
    if (!state.selected.size) return;
    var act = b.dataset.bulk;
    var labels = { enable:'\u0641\u0639\u0627\u0644\u200C\u0633\u0627\u0632\u06CC', disable:'\u063A\u06CC\u0631\u0641\u0639\u0627\u0644\u200C\u0633\u0627\u0632\u06CC', resetVol:'\u0631\u06CC\u0633\u062A \u062D\u062C\u0645', delete:'\u062D\u0630\u0641' };
    confirmDial(labels[act] + ' \u06AF\u0631\u0648\u0647\u06CC', state.selected.size + ' \u06A9\u0627\u0631\u0628\u0631 \u0627\u0639\u0645\u0627\u0644 \u0645\u06CC\u200C\u0634\u0648\u062F. \u0627\u062F\u0627\u0645\u0647 \u0645\u06CC\u200C\u062F\u0647\u06CC\u061F', function(){
      API.post('/api/users/bulk', { usernames: Array.from(state.selected), action: act }).then(function(){
        toast('\u0627\u0646\u062C\u0627\u0645 \u0634\u062F'); state.selected.clear(); loadUsers(); loadStats();
      }).catch(function(e){ toast(e.message,'error'); });
    });
  });
});

document.getElementById('btn-new').addEventListener('click', function(){ openUserModal(null); });
document.getElementById('btn-refresh').addEventListener('click', function(){ loadUsers(); loadStats(); toast('\u0628\u0647\u200C\u0631\u0648\u0632 \u0634\u062F'); });
document.getElementById('search').addEventListener('input', debounce(loadUsers, 250));
function debounce(fn, ms){ var t; return function(){ clearTimeout(t); t = setTimeout(fn, ms); }; }

/* ---------- user modal ---------- */
function openUserModal(username){
  state.editing = username;
  var u = null;
  if (username) {
    u = state.users.find(function(x){ return x.username === username; });
    document.getElementById('mu-title').textContent = '\u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0627\u0631\u0628\u0631';
    document.getElementById('mu-sub').textContent = username;
  } else {
    document.getElementById('mu-title').textContent = '\u06A9\u0627\u0631\u0628\u0631 \u062C\u062F\u06CC\u062F';
    document.getElementById('mu-sub').textContent = '\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0627\u0631\u0628\u0631 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F';
  }
  document.getElementById('f-username').value = u ? u.username : '';
  document.getElementById('f-uuid').value = u ? u.uuid : '';
  document.getElementById('f-limitGb').value = u && u.limit_gb != null ? u.limit_gb : '';
  document.getElementById('f-expiryDays').value = u && u.expiry_days != null ? u.expiry_days : '';
  document.getElementById('f-limitReq').value = u && u.limit_req != null ? u.limit_req : '';
  document.getElementById('f-ipLimit').value = u && u.ip_limit != null ? u.ip_limit : '';
  document.getElementById('f-connectionType').value = u ? (u.connection_type || 'vless+trojan') : 'vless+trojan';
  document.getElementById('f-port').value = u ? String(u.port || 443) : '443';
  document.getElementById('f-path').value = u ? (u.path || '/') : '/';
  document.getElementById('f-fingerprint').value = u ? (u.fingerprint || 'chrome') : 'chrome';
  document.getElementById('f-sniHost').value = u ? (u.sni_host || '') : '';
  document.getElementById('f-fragment').value = u ? (u.fragment || '') : '';
  document.getElementById('f-userProxyIata').value = u ? (u.user_proxy_iata || '') : '';
  document.getElementById('f-userSocks5').value = u ? (u.user_socks5 || '') : '';
  document.getElementById('f-routeDirect').value = u ? parseList(u.route_direct) : '';
  document.getElementById('f-routeBlock').value = u ? parseList(u.route_block) : '';
  document.getElementById('f-dohUrl').value = u ? (u.doh_url || '') : '';
  document.getElementById('f-blockPorn').checked = !!(u && u.block_porn);
  document.getElementById('f-blockAds').checked = !!(u && u.block_ads);
  document.getElementById('f-blockMalware').checked = !!(u && u.block_malware);
  document.getElementById('f-isActive').checked = u ? !!u.is_active : true;
  document.getElementById('f-note').value = u ? (u.note || '') : '';
  openModal('modal-user');
}
function parseList(s){ if (!s) return ''; try { return (JSON.parse(s)||[]).join(', '); } catch(e){ return s; } }
function csvList(s){ var v = (s||'').split(',').map(function(x){return x.trim().split(String.fromCharCode(10)).join('').trim();}).filter(Boolean); return v.length ? JSON.stringify(v) : null; }

document.getElementById('mu-save').addEventListener('click', async function(){
  var body = {
    username: document.getElementById('f-username').value.trim(),
    uuid: document.getElementById('f-uuid').value.trim() || undefined,
    limitGb: parseFloat(document.getElementById('f-limitGb').value) || null,
    expiryDays: parseInt(document.getElementById('f-expiryDays').value) || null,
    limitReq: parseInt(document.getElementById('f-limitReq').value) || null,
    ipLimit: parseInt(document.getElementById('f-ipLimit').value) || null,
    connectionType: document.getElementById('f-connectionType').value,
    port: parseInt(document.getElementById('f-port').value) || 443,
    path: document.getElementById('f-path').value || '/',
    fingerprint: document.getElementById('f-fingerprint').value,
    sniHost: document.getElementById('f-sniHost').value.trim() || null,
    fragment: document.getElementById('f-fragment').value.trim() || null,
    userProxyIata: document.getElementById('f-userProxyIata').value.trim().toUpperCase() || null,
    userSocks5: document.getElementById('f-userSocks5').value.trim() || null,
    routeDirect: csvList(document.getElementById('f-routeDirect').value),
    routeBlock: csvList(document.getElementById('f-routeBlock').value),
    dohUrl: document.getElementById('f-dohUrl').value.trim() || null,
    blockPorn: document.getElementById('f-blockPorn').checked,
    blockAds: document.getElementById('f-blockAds').checked,
    blockMalware: document.getElementById('f-blockMalware').checked,
    isActive: document.getElementById('f-isActive').checked,
    note: document.getElementById('f-note').value || null
  };
  if (!body.username) return toast('\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0644\u0627\u0632\u0645 \u0627\u0633\u062A', 'error');
  var btn = this; btn.disabled = true; btn.textContent = '\u062F\u0631 \u062D\u0627\u0644 \u0630\u062E\u06CC\u0631\u0647...';
  try {
    if (state.editing) {
      await API.patch('/api/users/' + encodeURIComponent(state.editing), body);
      toast('\u06A9\u0627\u0631\u0628\u0631 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F');
    } else {
      await API.post('/api/users', body);
      toast('\u06A9\u0627\u0631\u0628\u0631 \u0633\u0627\u062E\u062A\u0647 \u0634\u062F');
    }
    closeModal('modal-user');
    loadUsers(); loadStats();
  } catch(e){ toast(e.message, 'error'); }
  btn.disabled = false; btn.textContent = '\u0630\u062E\u06CC\u0631\u0647 \u06A9\u0627\u0631\u0628\u0631';
});

/* ---------- sub modal ---------- */
function openSubModal(username){
  var origin = location.origin;
  var subUrl = origin + '/sub/' + encodeURIComponent(username);
  document.getElementById('sub-url').textContent = subUrl;
  var qrBox = document.getElementById('sub-qr');
  qrBox.innerHTML = '';
  try {
    var qr = qrcode(0, 'M');
    qr.addData(subUrl); qr.make();
    var img = qr.createDataURL(6, 8);
    qrBox.innerHTML = '<div class="qr-box"><img src="' + img + '" alt="QR"/></div>';
  } catch(e){
    qrBox.innerHTML = '<div class="text-xs text-slate-400">QR \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A</div>';
  }
  var formats = [
    { label: 'Base64 (\u0639\u0645\u0648\u0645\u06CC)', url: subUrl },
    { label: 'Clash', url: subUrl + '?format=clash' },
    { label: 'sing-box', url: subUrl + '?format=singbox' },
    { label: 'Raw (v2rayNG)', url: subUrl + '?format=raw' }
  ];
  document.getElementById('sub-formats').innerHTML = formats.map(function(f){
    return '<a href="' + f.url + '" target="_blank" class="btn btn-ghost" style="font-size:12px">' + f.label + '</a>';
  }).join('');
  API.get('/sub/' + encodeURIComponent(username) + '?format=raw').then(function(text){
    document.getElementById('sub-raw').textContent = text;
  }).catch(function(){});
  openModal('modal-sub');
}
document.getElementById('sub-copy').addEventListener('click', function(){
  var t = document.getElementById('sub-url').textContent;
  navigator.clipboard.writeText(t).then(function(){ toast('\u06A9\u067E\u06CC \u0634\u062F'); }).catch(function(){ toast('\u06A9\u067E\u06CC \u0646\u0627\u0645\u0648\u0641\u0642', 'error'); });
});

/* ---------- proxies ---------- */
async function loadProxies(){
  try {
    var r = await API.get('/api/proxies?pageSize=100');
    document.getElementById('proxy-count').textContent = fmtNum(r.total) + ' \u067E\u0631\u0648\u06A9\u0633\u06CC';
    var ps = r.proxies || [];
    if (!ps.length) {
      document.getElementById('proxies-table').innerHTML = '<div class="empty">\u0647\u0646\u0648\u0632 \u067E\u0631\u0648\u06A9\u0633\u06CC\u200C\u0627\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u0634\u062F\u0647</div>';
      return;
    }
    document.getElementById('proxies-table').innerHTML =
      '<table><thead><tr><th>URI</th><th>\u06A9\u0634\u0648\u0631</th><th>Latency</th><th>\u0648\u0636\u0639\u06CC\u062A</th><th></th></tr></thead><tbody>' +
      ps.map(function(p){
        return '<tr>' +
          '<td class="mono text-[11px]" style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(p.uri) + '</td>' +
          '<td><span class="chip chip-cyan">' + esc((p.country||'\u2014').toUpperCase()) + '</span></td>' +
          '<td class="text-xs text-slate-400">' + (p.latency_ms ? p.latency_ms + 'ms' : '\u2014') + '</td>' +
          '<td>' + (p.is_active ? '<span class="chip chip-green">\u0641\u0639\u0627\u0644</span>' : '<span class="chip chip-red">\u063A\u06CC\u0631\u0641\u0639\u0627\u0644</span>') + '</td>' +
          '<td><button class="btn btn-ghost btn-icon" data-pid="' + p.id + '" title="\u062D\u0630\u0641"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></td>' +
        '</tr>';
      }).join('') + '</tbody></table>';
    document.querySelectorAll('[data-pid]').forEach(function(b){
      b.addEventListener('click', function(){
        API.del('/api/proxies/' + b.dataset.pid).then(function(){ toast('\u062D\u0630\u0641 \u0634\u062F'); loadProxies(); }).catch(function(e){ toast(e.message,'error'); });
      });
    });
  } catch(e){ document.getElementById('proxies-table').innerHTML = '<div class="empty text-rose-400">' + esc(e.message) + '</div>'; }
}
document.getElementById('proxy-import').addEventListener('click', async function(){
  var url = document.getElementById('proxy-url').value.trim();
  var cc = document.getElementById('proxy-cc').value.trim().toUpperCase();
  if (!url) return toast('URL \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646', 'error');
  var b = this; b.disabled = true; b.textContent = '\u062F\u0631 \u062D\u0627\u0644 \u0627\u06CC\u0645\u067E\u0648\u0631\u062A...';
  try {
    var r = await API.post('/api/proxies/import', { url: url, country: cc });
    toast(r.imported + ' \u067E\u0631\u0648\u06A9\u0633\u06CC \u0627\u06CC\u0645\u067E\u0648\u0631\u062A \u0634\u062F');
    loadProxies();
  } catch(e){ toast(e.message, 'error'); }
  b.disabled = false; b.textContent = '\u0627\u06CC\u0645\u067E\u0648\u0631\u062A';
});
document.getElementById('proxy-health').addEventListener('click', function(){
  API.post('/api/proxies/health', {}).then(function(){ toast('\u0628\u0631\u0631\u0633\u06CC \u0633\u0644\u0627\u0645\u062A \u0632\u0645\u0627\u0646\u200C\u0628\u0646\u062F\u06CC \u0634\u062F'); }).catch(function(e){ toast(e.message,'error'); });
});
document.getElementById('proxy-reload').addEventListener('click', function(){
  API.post('/api/proxies/pool/reload', {}).then(function(r){ toast(r.active + ' \u067E\u0631\u0648\u06A9\u0633\u06CC \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u0634\u062F'); }).catch(function(e){ toast(e.message,'error'); });
});

/* ---------- modal helpers ---------- */
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('[data-close-modal]').forEach(function(b){
  b.addEventListener('click', function(){
    b.closest('.modal-backdrop').classList.remove('open');
  });
});
document.querySelectorAll('.modal-backdrop').forEach(function(m){
  m.addEventListener('click', function(e){ if (e.target === m) m.classList.remove('open'); });
});
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(function(m){ m.classList.remove('open'); });
});

/* ---------- confirm dialog ---------- */
var _cfCb = null;
function confirmDial(title, msg, cb){
  document.getElementById('cf-title').textContent = title;
  document.getElementById('cf-msg').textContent = msg;
  _cfCb = cb;
  openModal('modal-confirm');
}
document.getElementById('cf-ok').addEventListener('click', function(){
  closeModal('modal-confirm');
  if (_cfCb) { var f = _cfCb; _cfCb = null; f(); }
});

/* ---------- start ---------- */
boot();
<\/script>
</body></html>`}function Ft(){return"<!doctype html><html><head><title>404</title><style>body{font-family:monospace;background:#0b1220;color:#94a3b8;text-align:center;padding:3rem}</style></head><body><h1>404 Not Found</h1><p>nginx/1.25.3</p></body></html>"}function pn(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function tr(t,e){let r=pn,n=Number(t.used_gb||0),s=t.limit_gb,a=s?Math.min(100,Math.round(n/s*100)):0;return'<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>'+r(String(t.username||"user"))+' \u2014 \u0648\u0636\u0639\u06CC\u062A</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"/><script src="https://cdn.tailwindcss.com"><\/script><style>body{font-family:Vazirmatn;background:#000;color:#e5e7eb;min-height:100vh;background:radial-gradient(ellipse at top,rgba(34,211,238,.12),transparent 60%),#000}.glass{background:rgba(10,12,20,.72);backdrop-filter:blur(18px);border:1px solid rgba(148,163,184,.12)}</style></head><body class="grid place-items-center p-4"><div class="w-full max-w-md glass rounded-3xl p-7"><div class="flex items-center gap-3 mb-5"><img src="/icon.svg" class="w-12 h-12"/><div><h1 class="text-xl font-black">'+r(String(t.username||""))+'</h1><p class="text-xs text-slate-400">\u0635\u0641\u062D\u0647 \u0648\u0636\u0639\u06CC\u062A \u06A9\u0627\u0631\u0628\u0631</p></div></div><div class="space-y-3 text-sm"><div class="flex justify-between p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><span class="text-slate-400">\u062D\u062C\u0645 \u0645\u0635\u0631\u0641\u200C\u0634\u062F\u0647</span><span class="font-bold text-cyan-400">'+n.toFixed(2)+' GB</span></div><div class="flex justify-between p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><span class="text-slate-400">\u0633\u0642\u0641</span><span class="font-bold">'+(s==null?"\u221E":s.toFixed(2)+" GB")+'</span></div><div class="h-2 rounded-full overflow-hidden" style="background:rgba(148,163,184,.1)"><div style="height:100%;width:'+a+'%;background:linear-gradient(90deg,#22d3ee,#0ea5e9)"></div></div><div class="flex justify-between p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><span class="text-slate-400">\u0627\u0646\u0642\u0636\u0627</span><span class="font-bold">'+(t.expiry_days==null?"\u221E":r(String(t.expiry_days))+" \u0631\u0648\u0632")+'</span></div><div class="flex justify-between p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><span class="text-slate-400">\u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627</span><span class="font-bold">'+r(String(t.used_req||0))+'</span></div></div><a class="mt-5 inline-flex w-full justify-center items-center gap-2 py-3 rounded-xl font-bold" style="background:linear-gradient(135deg,#22d3ee,#0ea5e9);color:#00131c" href="/sub/'+encodeURIComponent(String(t.username||""))+'">\u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0646\u06A9 \u0627\u0634\u062A\u0631\u0627\u06A9</a><pre style="display:none" id="cfg">'+r(e)+"</pre></div></body></html>"}var nt=["104.21.25.236","104.25.18.135","45.95.241.156","104.17.2.204","104.18.116.88","104.24.200.193","104.18.131.149","104.24.64.50","172.64.80.223","172.67.204.122","104.20.5.43","104.19.145.139","104.16.157.102","104.21.210.159","172.65.234.100","104.21.13.119","104.21.78.62","104.17.131.244","104.18.200.104","104.17.237.123","104.19.75.119","172.66.165.46","104.19.69.35","104.25.28.186","172.67.139.36","104.25.32.199","172.64.157.115","104.21.27.230","172.65.108.158","104.21.25.127","162.159.61.163","104.17.198.61","104.27.82.136","2.16.125.13","104.25.247.5","104.24.22.33","104.16.227.74","104.20.58.164","89.116.180.250","104.25.155.45","172.66.213.38","172.67.161.96","172.67.227.250","104.25.54.8","104.17.66.215","172.67.73.198","23.227.60.0","104.25.127.127","104.16.68.77","2.16.125.21","162.159.139.14","104.18.151.46","104.21.29.109","172.64.230.176","209.46.30.26","104.16.104.85","104.24.226.143","104.16.55.62","104.25.139.165","104.16.86.1","104.24.53.202","104.21.115.177","104.21.38.239","172.66.197.67","104.18.94.126","2.16.1.165","185.7.240.178","104.24.219.77","104.19.84.82","104.17.130.100","104.18.226.166","104.18.247.102","172.64.83.41","172.67.230.214","104.24.190.80","5.10.214.102","104.24.215.239","104.25.99.169","104.24.161.23","104.17.159.116"];function xt(t){if(!t)return nt;try{if(Array.isArray(t)&&t.length)return t.filter(e=>typeof e=="string");if(typeof t=="string"){let e=JSON.parse(t);if(Array.isArray(e)&&e.length)return e}}catch{}return nt}var hn=new Set(["443","2053","2083","2087","2096","8443"]);async function Wt(t,e,r="base64"){let n=fn(t,e);if(r==="raw")return{body:n.join(`
`),contentType:"text/plain; charset=utf-8"};if(r==="clash")return{body:mn(t,e,n),contentType:"text/yaml; charset=utf-8"};if(r==="singbox")return{body:JSON.stringify(gn(t,e,n),null,2),contentType:"application/json; charset=utf-8"};let a=["# Sub Update: OK","# Random Code: "+Math.random().toString(36).slice(2,10),"# Aether Panel",""].join(`
`)+n.join(`
`);return{body:rr(a),contentType:"text/plain; charset=utf-8"}}function fn(t,e){let r=[],n=e.host,s=t.sni_host||n,a=t.fingerprint||"chrome",o="/"+Math.random().toString(36).slice(2,12),i=encodeURIComponent(o),c=xt(t.ips).slice(0,30),l=String(t.port||"443").split(",").map(w=>w.trim()).filter(Boolean),d=String(t.connection_type||"vless").toLowerCase(),u=d.includes("vless")||!d.includes("trojan"),p=d.includes("trojan"),h=d.includes("vmess"),m="";t.fragment&&(m+="&fragment="+encodeURIComponent(t.fragment));for(let w of c)for(let x of l){let y=hn.has(x),g=y?"tls":"none",v="Aether|"+t.username+"|"+w,b=encodeURIComponent(v);if(u&&r.push("vless://"+t.uuid+"@"+w+":"+x+"?path="+i+"&security="+g+"&encryption=none&insecure=0&host="+encodeURIComponent(s)+"&fp="+a+"&type=ws&allowInsecure=0&sni="+encodeURIComponent(s)+m+"#"+b),p&&r.push("trojan://"+t.uuid+"@"+w+":"+x+"?path="+i+"&security="+g+"&insecure=0&host="+encodeURIComponent(s)+"&fp="+a+"&type=ws&allowInsecure=0&sni="+encodeURIComponent(s)+m+"#"+b),h){let k={v:"2",ps:v,add:w,port:x,id:t.uuid,aid:"0",net:"ws",type:"none",host:s,path:o,tls:y?"tls":"",sni:s};r.push("vmess://"+rr(JSON.stringify(k)))}}return r}function mn(t,e,r){let n=e.host,s=t.sni_host||n,a=xt(t.ips)[0]||nt[0],o=er(t.route_direct),i=er(t.route_block),c=o.map(d=>"  - DOMAIN-SUFFIX,"+d+",DIRECT").join(`
`),l=i.map(d=>"  - DOMAIN-SUFFIX,"+d+",REJECT").join(`
`);return`# Aether Panel Clash configuration
mixed-port: 7890
allow-lan: false
mode: rule
log-level: info
ipv6: true
dns:
  enable: true
  listen: 0.0.0.0:53
  default-nameserver: [1.1.1.1, 8.8.8.8]
  nameserver: [https://cloudflare-dns.com/dns-query, https://dns.google/dns-query]
proxies:
  - name: "aether-`+t.username+`"
    type: vless
    server: `+a+`
    port: `+(t.port||443)+`
    uuid: `+t.uuid+`
    network: ws
    tls: true
    servername: `+s+`
    ws-opts:
      path: "/"
      headers:
        Host: `+s+`
    client-fingerprint: `+(t.fingerprint||"chrome")+`
proxy-groups:
  - name: PROXY
    type: select
    proxies: ["aether-`+t.username+`"]
rules:
`+(c?c+`
`:"")+(l?l+`
`:"")+`  - GEOIP,IR,DIRECT
  - MATCH,PROXY
`}function gn(t,e,r){let n=t.sni_host||e.host,s=xt(t.ips)[0]||nt[0];return{log:{level:"info"},dns:{servers:[{tag:"cf",address:"https://cloudflare-dns.com/dns-query"},{tag:"local",address:"local",detour:"direct"}],rules:[{domain_suffix:[".ir"],server:"local"}]},outbounds:[{type:"vless",tag:"proxy",server:s,server_port:t.port||443,uuid:t.uuid,tls:{enabled:!0,server_name:n,utls:{enabled:!0,fingerprint:t.fingerprint||"chrome"}},transport:{type:"ws",path:"/"}},{type:"direct",tag:"direct"},{type:"block",tag:"block"}],route:{final:"proxy"}}}function er(t){if(!t)return[];try{let e=JSON.parse(t);return Array.isArray(e)?e.filter(r=>typeof r=="string"):[]}catch{return[]}}function rr(t){let e=new TextEncoder().encode(t),r="";for(let n=0;n<e.byteLength;n++)r+=String.fromCharCode(e[n]);return btoa(r)}var bn={bytesUnflushed:0,requestsUnflushed:0,lastFlush:0,active:{}},yn=25*1024*1024,xn=3e4,Vt=class{state;env;data={...bn};flushTimer=null;constructor(e,r){this.state=e,this.env=r,this.state.blockConcurrencyWhile(async()=>{let n=await this.state.storage.get("data");n&&(this.data=n)}),this.flushTimer=setInterval(()=>{this.state.waitUntil(this.flush())},xn)}async fetch(e){let r=new URL(e.url);switch(r.pathname.replace(/^\//,"")){case"connect":{let{ip:s,subnet:a,ua:o}=await e.json(),i=parseInt(r.searchParams.get("ipLimit")||"0",10),c=Object.keys(this.data.active);return i>0&&c.length>=i&&!this.data.active[a]?Response.json({ok:!1,code:"ip_limit",active:c.length}):(this.data.active[a]={ip:s,subnet:a,ua:o,startedAt:Date.now()},await this.persist(),Response.json({ok:!0,active:Object.keys(this.data.active).length}))}case"disconnect":{let{subnet:s}=await e.json();return delete this.data.active[s],await this.persist(),Response.json({ok:!0,active:Object.keys(this.data.active).length})}case"addBytes":{let{bytes:s,requests:a}=await e.json();return this.data.bytesUnflushed+=s|0,this.data.requestsUnflushed+=(a||0)|0,this.data.bytesUnflushed>=yn&&this.state.waitUntil(this.flush()),Response.json({ok:!0,unflushed:this.data.bytesUnflushed})}case"status":return Response.json({active:Object.keys(this.data.active).length,unflushedBytes:this.data.bytesUnflushed,unflushedRequests:this.data.requestsUnflushed,connections:this.data.active});case"flush":return await this.flush(),Response.json({ok:!0});default:return new Response("not found",{status:404})}}async persist(){await this.state.storage.put("data",this.data)}async flush(){if(this.data.bytesUnflushed===0&&this.data.requestsUnflushed===0)return;let e=this.data.bytesUnflushed,r=this.data.requestsUnflushed;this.data.bytesUnflushed=0,this.data.requestsUnflushed=0,this.data.lastFlush=Date.now(),await this.persist();try{let n=this.state.id.name?.toString()||"";if(n){let s=e/1073741824;await this.env.DB.prepare(`UPDATE users
             SET used_gb = used_gb + ?,
                 lifetime_gb = lifetime_gb + ?,
                 used_req = used_req + ?,
                 last_active = ?
           WHERE username = ?`).bind(s,s,r,Math.floor(Date.now()/1e3),n).run()}}catch(n){this.data.bytesUnflushed+=e,this.data.requestsUnflushed+=r,await this.persist(),console.error("UserState flush failed",n)}}};var wn={byCountry:{}},zt=class{state;env;data=wn;alarmScheduled=!1;constructor(e,r){this.state=e,this.env=r,this.state.blockConcurrencyWhile(async()=>{let n=await this.state.storage.get("pool");n&&(this.data=n)})}async fetch(e){let r=new URL(e.url),n=r.pathname.replace(/^\//,"");if(n==="pick"){let s=(r.searchParams.get("cc")||"").toUpperCase(),o=(s?this.data.byCountry[s]||[]:Object.values(this.data.byCountry).flat()).filter(c=>c.ok);if(!o.length)return Response.json({error:"empty pool"},{status:503});let i=o[Math.floor(Math.random()*o.length)];return Response.json({uri:i.uri,latencyMs:i.latencyMs,country:i.country})}if(n==="import"){let{country:s,list:a}=await e.json(),o=(s||"XX").toUpperCase();return this.data.byCountry[o]=a.map(i=>({uri:i,country:o,ok:!0,lastChecked:0})),await this.state.storage.put("pool",this.data),this.scheduleAlarm(),Response.json({ok:!0,count:a.length})}return n==="health-check"?(vn(this.state,this.healthCheck()),Response.json({ok:!0})):new Response("not found",{status:404})}scheduleAlarm(){this.alarmScheduled||(this.alarmScheduled=!0,this.state.storage.setAlarm(6e4).catch(()=>{}))}async alarm(){this.alarmScheduled=!1,await this.healthCheck(),Object.values(this.data.byCountry).flat().length&&this.scheduleAlarm()}async healthCheck(){let r=Object.values(this.data.byCountry).flat().slice(0,50);for(let n of r){try{let s=new URL(n.uri),a=s.hostname,o=parseInt(s.port||"1080",10),i=Date.now(),c=new AbortController,l=setTimeout(()=>c.abort(),4e3),d=await fetch(`https://${a}:${o}`,{method:"HEAD",signal:c.signal,mode:"no-cors"}).catch(()=>null);clearTimeout(l),n.latencyMs=Date.now()-i,n.ok=!!d}catch{n.ok=!1}n.lastChecked=Date.now()}for(let n of Object.keys(this.data.byCountry))this.data.byCountry[n]=this.data.byCountry[n].filter(s=>s.ok);await this.state.storage.put("pool",this.data)}};function vn(t,e){try{t.waitUntil(e)}catch{}}var Gt=class{state;env;bucket={count:0,resetAt:0};constructor(e,r){this.state=e,this.env=r,this.state.blockConcurrencyWhile(async()=>{let n=await this.state.storage.get("b");n&&(this.bucket=n)})}async fetch(e){let r=new URL(e.url),n=parseInt(r.searchParams.get("limit")||"5",10),s=parseInt(r.searchParams.get("window")||"900000",10),a=Date.now();return a>this.bucket.resetAt&&(this.bucket={count:0,resetAt:a+s}),this.bucket.count+=1,await this.state.storage.put("b",this.bucket),Response.json({ok:this.bucket.count<=n,count:this.bucket.count,remaining:Math.max(0,n-this.bucket.count),resetAt:this.bucket.resetAt})}};var nr=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#020617"/>
  <rect x="48" y="48" width="416" height="416" rx="88" fill="url(#g)" opacity="0.18"/>
  <g transform="translate(128,96) scale(16)" fill="none" stroke="#67e8f9" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M4 22 L14 2 L14 12 L22 12 L10 30 L10 20 L4 20 Z"/>
  </g>
</svg>`,sr=JSON.stringify({name:"Aether Panel",short_name:"Aether",description:"Modern Cloudflare Worker proxy panel",start_url:"/panel",scope:"/",display:"standalone",background_color:"#07090d",theme_color:"#07090d",dir:"rtl",lang:"fa-IR",orientation:"any",icons:[{src:"/icon.svg",sizes:"192x192 512x512",type:"image/svg+xml",purpose:"any maskable"}],categories:["utilities","productivity"]}),ar=`
const CACHE = "aether-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (u.pathname.startsWith("/api/") || u.pathname.startsWith("/sub/")) return;
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(e.request);
      const run = fetch(e.request).then((res) => {
        if (res && res.status === 200) cache.put(e.request, res.clone());
        return res;
      }).catch(() => hit);
      return hit || run;
    })
  );
});
`;var _=new I;_.use("*",Ee());_.use("/api/*",xe({origin:t=>t||"*",credentials:!0}));_.get("/manifest.json",t=>t.json(JSON.parse(sr),200,{"content-type":"application/manifest+json"}));_.get("/icon.svg",t=>t.body(nr,200,{"content-type":"image/svg+xml"}));_.get("/sw.js",t=>t.body(ar,200,{"content-type":"application/javascript"}));_.route("/api/auth",j);_.route("/api/users",O);_.route("/api/proxies",D);_.route("/api/system",W);_.post("/tg/webhook",async t=>t.env.TELEGRAM_TOKEN?Qe(t.req.raw,t.env):t.text("bot disabled",404));_.get("/api/health",t=>t.json({ok:!0,version:t.env.APP_VERSION,ts:Date.now()}));_.get("/api/traffic/:username",async t=>{let e=t.req.param("username"),r=Math.min(168,parseInt(t.req.query("hours")||"24",10)),n=Math.floor(Date.now()/1e3)-r*3600,s=await t.env.DB.prepare("SELECT hour_bucket, bytes_up, bytes_down, requests FROM traffic_hourly WHERE username = ? AND hour_bucket >= ? ORDER BY hour_bucket").bind(e,n).all();return t.json({username:e,hours:r,points:s.results})});_.get("/api/stats",async t=>{let e=await t.env.DB.prepare("SELECT COUNT(*) AS n FROM users").first(),r=await t.env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE is_active = 1").first(),n=await t.env.DB.prepare("SELECT COALESCE(SUM(used_gb),0) AS s FROM users").first(),s=await t.env.DB.prepare("SELECT COALESCE(SUM(used_req),0) AS s FROM users").first();return t.json({users:e?.n??0,active:r?.n??0,usedGb:n?.s??0,usedReq:s?.s??0})});_.get("/sub/:user",async t=>{let e=decodeURIComponent(t.req.param("user")),r=await t.env.DB.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE OR uuid = ?").bind(e,e).first();if(!r)return t.text("not found",404);let n=t.req.query("format")||"base64",{body:s,contentType:a}=await Wt(r,{host:new URL(t.req.url).hostname,port:r.port??443,tls:r.tls!=="off"},n),o=(t.req.header("user-agent")||"").toLowerCase();return!o.includes("mozilla")&&!o.includes("chrome")&&t.executionCtx.waitUntil(t.env.DB.prepare("UPDATE users SET used_req = used_req + 1 WHERE username = ?").bind(r.username).run()),t.body(s,200,{"content-type":a,"profile-update-interval":"12","subscription-userinfo":`upload=0; download=${Math.floor((r.used_gb??0)*1024*1024*1024)}; total=${Math.floor((r.limit_gb??0)*1024*1024*1024)}; expire=${Math.floor(Date.now()/1e3)+(r.expiry_days??0)*86400}`})});_.get("/feed/:user",t=>t.redirect("/sub/"+encodeURIComponent(t.req.param("user")),302));_.get("/status/:user",async t=>{let e=decodeURIComponent(t.req.param("user")),r=await t.env.DB.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE OR uuid = ?").bind(e,e).first();if(!r)return t.text("not found",404);let{body:n}=await Wt(r,{host:new URL(t.req.url).hostname,port:r.port??443,tls:r.tls!=="off"},"raw");return t.html(tr(r,n))});_.get("/panel",t=>t.html(Ze(t.env.APP_VERSION,!1)));_.get("/login",t=>t.html(Xe()));_.get("/",t=>t.html(Ft()));_.get("*",t=>t.html(Ft(),404));var En=async(t,e,r)=>{r.waitUntil(Sn(e));let n=new URL(t.url);return(t.headers.get("upgrade")||"").toLowerCase()==="websocket"?$e(t,e,r):_.fetch(t,e,r)},kn=async(t,e,r)=>{let n=Date.now();if(t.cron==="* * * * *"){let s=e.POOL_STATE.idFromName("global");r.waitUntil(e.POOL_STATE.get(s).fetch("http://do/health-check"))}t.cron==="*/5 * * * *"&&r.waitUntil(An(e)),t.cron==="0 * * * *"&&r.waitUntil(Rn(e))},_n=async(t,e)=>{let r=new Map;for(let n of t.messages){let s=n.body;if(s?.type==="traffic"&&s.username){let a=r.get(s.username)||{bytes:0,requests:0};a.bytes+=s.bytes||0,a.requests+=s.requests||0,r.set(s.username,a)}}for(let[n,s]of r){let a=s.bytes/1073741824;await e.DB.prepare("UPDATE users SET used_gb = used_gb + ?, lifetime_gb = lifetime_gb + ?, used_req = used_req + ? WHERE username = ?").bind(a,a,s.requests,n).run()}};async function An(t){try{let e=Date.now(),{results:r}=await t.DB.prepare("SELECT * FROM users WHERE auto_rotate_ip = 1 AND rotate_minutes > 0 AND ? >= (last_rotate_time + rotate_minutes * 60000)").bind(e).all();if(!r?.length)return;let n=await fetch(t.PRIMARY_FETCH).catch(()=>null);if(!n||!n.ok)return;let a=(await n.text()).split(/----------+/),o={};for(let i of a){let c=i.split(`
`).map(u=>u.trim()).filter(Boolean),l="unknown",d=[];for(let u of c)u.startsWith("#")?l=u.slice(1).trim():u.startsWith("[")||d.push(u);d.length&&(o[l]=d)}for(let i of r){let c=i.ip_operator==="all"?Object.values(o).flat():o[String(i.ip_operator||"all")]||[];if(!c.length)continue;let l=Number(i.ip_count)||15,d=[];for(let u=0;u<l&&c.length;u++)d.push(c[Math.floor(Math.random()*c.length)]);await t.DB.prepare("UPDATE users SET ips = ?, last_rotate_time = ? WHERE id = ?").bind(JSON.stringify(d),e,i.id).run()}}catch(e){console.error("autoRotateIps",e)}}var or=!1;async function Sn(t){if(!or){or=!0;try{let e=await t.DB.prepare("SELECT COUNT(*) AS n FROM proxies").first();e&&e.n>0&&await J(t)}catch(e){console.error("ensurePoolSynced",e)}}}async function Rn(t){let e=Date.now(),r=Math.floor(e/864e5)*864e5;await t.DB.prepare(`UPDATE users SET used_gb = 0, is_active = 1, last_reset_vol_time = ?
      WHERE auto_reset_vol_days > 0 AND ? >= (last_reset_vol_time + auto_reset_vol_days * 86400000)`).bind(r,r).run(),await t.DB.prepare(`UPDATE users SET used_req = 0, is_active = 1, last_reset_req_time = ?
      WHERE auto_reset_req_days > 0 AND ? >= (last_reset_req_time + auto_reset_req_days * 86400000)`).bind(r,r).run()}var ho={fetch:En,scheduled:kn,queue:_n};export{zt as PoolState,Gt as RateLimiter,Vt as UserState,ho as default};
//# sourceMappingURL=index.js.map

(function(e){function n(n){for(var r,i,a=n[0],u=n[1],s=n[2],f=0,p=[];f<a.length;f++)i=a[f],Object.prototype.hasOwnProperty.call(o,i)&&o[i]&&p.push(o[i][0]),o[i]=0;for(r in u)Object.prototype.hasOwnProperty.call(u,r)&&(e[r]=u[r]);d&&d(n);while(p.length)p.shift()();return c.push.apply(c,s||[]),t()}function t(){for(var e,n=0;n<c.length;n++){for(var t=c[n],r=!0,a=1;a<t.length;a++){var u=t[a];0!==o[u]&&(r=!1)}r&&(c.splice(n--,1),e=i(i.s=t[0]))}return e}var r={},o={app:0},c=[];function i(n){if(r[n])return r[n].exports;var t=r[n]={i:n,l:!1,exports:{}};return e[n].call(t.exports,t,t.exports,i),t.l=!0,t.exports}i.m=e,i.c=r,i.d=function(e,n,t){i.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:t})},i.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,n){if(1&n&&(e=i(e)),8&n)return e;if(4&n&&"object"===typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(i.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var r in e)i.d(t,r,function(n){return e[n]}.bind(null,r));return t},i.n=function(e){var n=e&&e.__esModule?function(){return e["default"]}:function(){return e};return i.d(n,"a",n),n},i.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},i.p="";var a=window["webpackJsonp"]=window["webpackJsonp"]||[],u=a.push.bind(a);a.push=n,a=a.slice();for(var s=0;s<a.length;s++)n(a[s]);var d=u;c.push([4,"chunk-vendors"]),t()})({0:function(e,n){},1:function(e,n){},10:function(e,n){},11:function(e,n){},12:function(e,n){},13:function(e,n){},14:function(e,n){},2:function(e,n){},3:function(e,n){},4:function(e,n,t){e.exports=t("cd49")},5:function(e,n){},6:function(e,n){},7:function(e,n){},8:function(e,n){},9:function(e,n){},baed:function(e,n,t){},cd49:function(e,n,t){"use strict";t.r(n);t("e260"),t("e6cf"),t("cca6"),t("a79d");var r=t("7a23");function o(e,n){var t=Object(r["t"])("router-view");return Object(r["o"])(),Object(r["d"])(t)}t("e76e");var c=t("6b0d"),i=t.n(c);const a={},u=i()(a,[["render",o]]);var s=u,d=t("9483");Object(d["a"])("".concat("","service-worker.js"),{ready:function(){console.log("App is being served from cache by a service worker.\nFor more details, visit https://goo.gl/AFskqB")},registered:function(){console.log("Service worker has been registered.")},cached:function(){console.log("Content has been cached for offline use.")},updatefound:function(){console.log("New content is downloading.")},updated:function(){console.log("New content is available; please refresh.")},offline:function(){console.log("No internet connection found. App is running in offline mode.")},error:function(e){console.error("Error during service worker registration:",e)}});var f=t("6c02"),p={class:"home"};function l(e,n,t,o,c,i){return Object(r["o"])(),Object(r["e"])("div",p,[Object(r["z"])(Object(r["f"])("input",{"onUpdate:modelValue":n[0]||(n[0]=function(n){return e.roomId=n}),placeholder:"Room ID"},null,512),[[r["x"],e.roomId]]),Object(r["f"])("button",{onClick:n[1]||(n[1]=function(){return e.joinRoom&&e.joinRoom.apply(e,arguments)})},"Join")])}var b=Object(r["g"])({name:"Home",data:function(){return{roomId:""}},methods:{joinRoom:function(){this.$router.push({name:"Room",params:{id:this.roomId}})}}});const m=i()(b,[["render",l]]);var h=m,v={class:"room"},g=["srcObject"],w=["srcObject"];function O(e,n,t,o,c,i){return Object(r["o"])(),Object(r["e"])("div",v,[Object(r["f"])("p",null,"room id: "+Object(r["v"])(e.id),1),Object(r["f"])("video",{srcObject:e.localStream,muted:"",autoplay:""},null,8,g),(Object(r["o"])(!0),Object(r["e"])(r["a"],null,Object(r["s"])(e.remoteStreams,(function(e,n){return Object(r["o"])(),Object(r["e"])("video",{key:n,srcObject:e,autoplay:""},null,8,w)})),128))])}var j=t("1da1"),k=(t("96cf"),t("4ec9"),t("d3b7"),t("3ca3"),t("ddb0"),t("d81d"),t("4de4"),t("159b"),t("a4d3"),t("e01a"),t("e9c4"),t("caad"),t("f993")),x=Object(k["create"])({config:{Addresses:{Swarm:["/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star","/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star","/dns4/calm-castle-31280.herokuapp.com/tcp/443/wss/p2p-webrtc-star"]}}});function y(){return x}t("d093");var S=new TextEncoder,R=new TextDecoder,M=Object(r["g"])({name:"Room",props:{id:String},setup:function(){return{localStream:new MediaStream,connections:new Map,makingOffer:new Map,ignoreOffer:new Map,unsubscribe:function(){}}},data:function(){return{remoteStreams:{}}},computed:{topic:function(){return"dcall-".concat(this.id)}},watch:{topic:{immediate:!0,handler:function(e){var n=this;this.unsubscribe();var t=y().then(function(){var t=Object(j["a"])(regeneratorRuntime.mark((function t(r){var o;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,r.pubsub.subscribe(e,n.handlePubsubMessage);case 2:return o=setInterval(Object(j["a"])(regeneratorRuntime.mark((function t(){var o;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,r.pubsub.peers(e);case 2:o=t.sent,o.filter(n.notConnected).map((function(e){return n.connect(e,!0)}));case 4:case"end":return t.stop()}}),t)}))),5e3),t.abrupt("return",(function(){return clearInterval(o),r.pubsub.unsubscribe(e,n.handlePubsubMessage)}));case 4:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}());this.unsubscribe=function(){return t.then((function(e){return e()}))}}}},mounted:function(){var e=this;navigator.mediaDevices.getUserMedia({audio:!0,video:{width:{ideal:1920},height:{ideal:1080}}}).then((function(n){n.getTracks().forEach((function(n){return e.localStream.addTrack(n)}))})).catch(console.error)},unmounted:function(){this.unsubscribe()},methods:{handlePubsubMessage:function(e){var n=this;return Object(j["a"])(regeneratorRuntime.mark((function t(){var r,o,c,i,a,u,s,d,f,p,l,b;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return r=e.from,o=e.data,t.next=3,y();case 3:return c=t.sent,t.next=6,c.id();case 6:if(i=t.sent,a=i.id,u=JSON.parse(R.decode(o)),s=u.target,d=u.candidate,f=u.description,s!==a){t.next=29;break}if(p=n.connections.get(r),!n.notConnected(r)&&p||(p=n.connect(r,!1)),!f){t.next=26;break}if(l=r<a,b="offer"===f.type&&(n.makingOffer.get(r)||"stable"!==p.signalingState),l||!b){t.next=17;break}return t.abrupt("return");case 17:return t.next=19,p.setRemoteDescription(f);case 19:if("offer"!==f.type){t.next=24;break}return t.next=22,p.setLocalDescription();case 22:return t.next=24,c.pubsub.publish(n.topic,S.encode(JSON.stringify({target:r,description:p.localDescription})));case 24:t.next=29;break;case 26:if(!d){t.next=29;break}return t.next=29,p.addIceCandidate(d);case 29:case"end":return t.stop()}}),t)})))()},notConnected:function(e){var n;return["disconnected","failed","closed",void 0].includes(null===(n=this.connections.get(e))||void 0===n?void 0:n.connectionState)},connect:function(e,n){var t,r=this,o=new RTCPeerConnection;return null===(t=this.connections.get(e))||void 0===t||t.close(),this.connections.set(e,o),setTimeout((function(){"connected"!==o.connectionState&&o.close()}),5e3),n&&o.addEventListener("negotiationneeded",Object(j["a"])(regeneratorRuntime.mark((function n(){var t;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:return r.makingOffer.set(e,!0),n.next=3,y();case 3:return t=n.sent,n.next=6,o.setLocalDescription();case 6:return n.next=8,t.pubsub.publish(r.topic,S.encode(JSON.stringify({target:e,description:o.localDescription})));case 8:r.makingOffer.set(e,!1);case 9:case"end":return n.stop()}}),n)})))),o.addEventListener("icecandidate",function(){var n=Object(j["a"])(regeneratorRuntime.mark((function n(t){var o,c;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:return o=t.candidate,n.next=3,y();case 3:return c=n.sent,n.next=6,c.pubsub.publish(r.topic,S.encode(JSON.stringify({target:e,candidate:o})));case 6:case"end":return n.stop()}}),n)})));return function(e){return n.apply(this,arguments)}}()),o.addEventListener("connectionstatechange",(function(){["disconnected","failed","closed"].includes(o.connectionState)})),o.addEventListener("track",(function(n){var t=n.track;void 0!==r.remoteStreams[e]?r.remoteStreams[e].addTrack(t):r.remoteStreams[e]=new MediaStream([t])})),this.localStream.getTracks().forEach((function(e){return o.addTrack(e)})),o}}});const P=i()(M,[["render",O]]);var T=P,C=[{path:"/",name:"Home",component:h},{path:"/room/:id",name:"Room",component:T,props:!0}],D=Object(f["a"])({history:Object(f["b"])(),routes:C}),E=D;Object(r["c"])(s).use(E).mount("#app")},e76e:function(e,n,t){"use strict";t("baed")}});
//# sourceMappingURL=app.9ebc1b0f.js.map
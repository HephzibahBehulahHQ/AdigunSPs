import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync("styles.css", "utf8");
const app = readFileSync("src/app.js", "utf8");
const html = readFileSync("index.html", "utf8");

assert.match(app, /matchMedia\("\(max-width: 760px\)"\)\.matches/, "panel controls must switch to drawer behavior at the tablet breakpoint");
assert.match(styles, /@media\(max-width:760px\)\{body\{height:100dvh\}/, "compact toolbar and mobile workspace layout must include 710px viewports");
assert.match(styles, /@media\(max-width:760px\)\{\.workspace \.left-sidebar,\.workspace \.right-sidebar\{display:none\}\}/, "tablet workspace sidebars must close behind drawer controls");
assert.match(styles, /@media\(max-width:760px\)\{\.workspace\{position:relative\}\.workspace\.mobile-left-open/, "tablet side drawers must have a positioned workspace container");
assert.match(styles, /@media\s*\(\s*min-width:\s*761px\s*\)/, "desktop workspace layout must begin immediately above the compact breakpoint");
assert.match(html, /id="accountButton"[^>]*class="icon-button account-button[\s\S]*?<svg[\s\S]*?account-status-dot/, "top-bar account control uses a profile icon and status dot");
assert.match(html, /id="accountAvatarImage" class="account-avatar-image"[^>]*hidden/, "top-bar account control includes an uploaded-avatar image fallback");
assert.match(styles, /\.account-button \.account-avatar-image\{[^}]*border-radius:50%;object-fit:cover/, "uploaded profile photos are cropped to the round account control");
assert.match(app, /async function updateAccountAvatar\(user, avatarUrl\)[\s\S]*?accountService\.getProfile\(user\)[\s\S]*?image\.onerror[\s\S]*?showAccountAvatarFallback/, "profile avatar loads from the profile row and broken URLs fall back to the default icon");
assert.match(app, /const showAvatar = \(\) => \{[\s\S]*?icon\.toggleAttribute\("hidden", true\);[\s\S]*?if \(image\.complete && image\.naturalWidth > 0\) showAvatar\(\)/, "cached avatars hide the default icon immediately after a successful image load");
assert.match(app, /void updateAccountAvatar\(state === "member" \? accountUser : null\)/, "session restoration and sign-in reload the stored profile avatar");
assert.match(app, /const profile = await accountService\.uploadAvatar\(accountUser, file\); await updateAccountAvatar\(accountUser, profile\.avatar_url\)/, "upload immediately refreshes the top-bar avatar");
assert.doesNotMatch(html, /id="accountButton"[^>]*>Account</, "top-bar account control does not render the Account word");
assert.match(html, /id="languageButton"[^>]*>EN<\/button>/, "compact language toggle remains visible beside the profile icon");
assert.match(app, /button\.dataset\.accountState = state;[\s\S]*?classList\.toggle\("is-signed-in", state === "member"\)/, "signed-in state is reflected on the profile control");
assert.match(app, /button\.setAttribute\("aria-label", label\);[\s\S]*?button\.title = label;/, "profile icon tooltip and accessible name track account state");
assert.match(styles, /\.top-actions\{gap:12px;flex:0 0 auto;min-width:max-content\}/, "desktop top-bar controls have a consistent gap and cannot collapse into overlap");
assert.match(styles, /@media\(max-width:760px\)\{[\s\S]*?\.top-actions\{margin-left:2px;gap:6px\}/, "mobile controls keep a visible gap and compact layout");
assert.match(styles, /@media\(max-width:360px\)\{[\s\S]*?\.top-actions\{gap:6px\}/, "small phones retain a consistent control gap");
assert.match(styles, /\.account-button\.is-signed-in \.account-status-dot\{background:#46c37b\}/, "signed-in account has a green status dot");
assert.match(styles, /\.account-button\.is-guest \.account-status-dot\{background:#879198\}/, "guest account has a gray status dot");

console.log("Responsive layout breakpoint checks passed.");


// SVG has no HTMLElement.hidden property: test the actual attribute, not a plain hidden-field stub.
const iconAttributes=new Set();const avatarIcon={toggleAttribute:(name,on)=>on?iconAttributes.add(name):iconAttributes.delete(name)};
const avatarImage={hidden:true,complete:false,naturalWidth:0,removeAttribute(name){if(name==="src")delete this.src;}};
const avatarContext={$:selector=>selector==="#accountAvatarImage"?avatarImage:avatarIcon,accountAvatarRequestId:0,accountUser:{id:"owner"},accountAccess:"member",accountService:{getProfile:async()=>({avatar_url:"https://image.example/avatar.png"})}};
const avatarFunctions=app.slice(app.indexOf("function showAccountAvatarFallback("),app.indexOf("function setAccountAccess("));
runInNewContext(avatarFunctions,avatarContext);
await avatarContext.updateAccountAvatar(avatarContext.accountUser);
avatarImage.onload();assert.equal(avatarImage.hidden,false);assert.ok(iconAttributes.has("hidden"),"loaded avatar hides SVG by attribute");
avatarImage.onerror();assert.equal(avatarImage.hidden,true);assert.ok(!iconAttributes.has("hidden"),"broken image restores SVG attribute visibility");assert.equal(avatarImage.src,undefined);
await avatarContext.updateAccountAvatar(avatarContext.accountUser,null);assert.ok(!iconAttributes.has("hidden"),"no-picture fallback remains visible");
avatarImage.complete=true;avatarImage.naturalWidth=64;await avatarContext.updateAccountAvatar(avatarContext.accountUser,"https://image.example/cached.png");assert.equal(avatarImage.hidden,false);assert.ok(iconAttributes.has("hidden"),"cached image immediately hides SVG without waiting for load");
let resolveProfile;avatarContext.accountService.getProfile=()=>new Promise(resolve=>{resolveProfile=resolve;});
const pendingAvatar=avatarContext.updateAccountAvatar(avatarContext.accountUser);avatarContext.accountUser=null;avatarContext.accountAccess="guest";
await avatarContext.updateAccountAvatar(null);resolveProfile({avatar_url:"https://image.example/stale.png"});await pendingAvatar;
assert.equal(avatarImage.src,undefined);assert.ok(!iconAttributes.has("hidden"),"late profile response cannot replace signed-out fallback");
assert.match(styles,/\.account-button \[hidden\]\{display:none!important\}/,"hidden SVG and avatar override display rules");

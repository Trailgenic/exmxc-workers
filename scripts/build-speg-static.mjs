// The source for crawlable HTML is the immutable, validated published sPEG Index release.
import { readFile, writeFile } from "node:fs/promises";
import { SPEG_INDEX_RELEASE } from "../lib/speg-index-v1.js";
const filename="webflow/speg-index-footer.html";
const text=await readFile(filename,"utf8");
const escape=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const keys=["constraint","substitution_resistance","economic_capture","persistence","cost_of_defense"];
const names=["Constraint","Substitution resistance","Economic capture","Persistence","Cost of defense"];
const floors=[3,3,3,3,2];
const card=p=>{
 const vector=keys.map(k=>p.dimensions[k].value);
 const misses=vector.map((v,i)=>v<floors[i]?names[i]+": "+v+"/"+floors[i]:null).filter(Boolean);
 const isMember=p.decision.membership_state==="member";
 const sourceIds=[...new Set(keys.flatMap(k=>p.dimensions[k].source_ids))];
 return `<article class="spi-card" data-speg-issuer="${escape(p.identity.stable_slug)}">
  <div class="spi-eyebrow">${isMember?"Released member":"Watchlist · non-member"} · ${escape(p.dimensions.constraint.confidence)} research confidence</div>
  <h3><a href="/speg-index-company-${escape(p.identity.stable_slug)}">${escape(p.identity.display_name)}</a></h3>
  <div class="spi-vector">SDS ${Number(p.score.total)}/20 · [${vector.map(v=>Number(v)).join(" · ")}]</div>
  <p class="spi-card-rule">${escape(misses.length?"Below floor: "+misses.join("; "):"Dimension floors met. See the full admission gate and evidence packet.")}</p>
  <div class="spi-meta"><div>Evidence packet: ${sourceIds.length} referenced source IDs</div><div><a href="https://mcp.exmxc.ai/speg/index/v1/profiles/${escape(p.identity.stable_slug)}">Structured profile</a></div></div>
</article>`;
};
let updated=text;
for(const [name,profiles] of [
 ["spi-includes",SPEG_INDEX_RELEASE.profiles.filter(p=>p.decision.membership_state==="member")],
 ["spi-watch",SPEG_INDEX_RELEASE.profiles.filter(p=>p.decision.research_decision==="watchlist")]
]){
 const start=`<!-- BEGIN SPEG STATIC ${name} -->`,end=`<!-- END SPEG STATIC ${name} -->`;
 if(updated.split(start).length!==2||updated.split(end).length!==2)throw Error("Missing static marker: "+name);
 const before=updated.slice(0,updated.indexOf(start)+start.length);
 const after=updated.slice(updated.indexOf(end));
 updated=before+"\n"+profiles.map(card).join("\n")+"\n"+after;
}
if(updated!==text){
 if(process.argv.includes("--check"))throw Error("Static sPEG markup is out of sync with the immutable released source");
 await writeFile(filename,updated);
 console.log("Updated sPEG static source-grounded fallback: "+SPEG_INDEX_RELEASE.release_id);
}else console.log("sPEG static fallback matches released dataset");

import { useState, useEffect, useRef } from "react";

// ─── SIMULATION DATA ──────────────────────────────────────────────────────────

const TEMPLATES = {
  transfer: {
    id: "transfer", label: "Transfer SUI", icon: "⟶", color: "#00D4FF",
    code: `module playground::transfer {
  use sui::coin::{Self, Coin};
  use sui::sui::SUI;
  use sui::transfer;

  public entry fun transfer_sui(
    coin: Coin<SUI>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext
  ) {
    // Split off the amount to send
    let payment = coin::split(&mut coin, amount, ctx);
    
    // Transfer to recipient
    transfer::public_transfer(payment, recipient);
    
    // Return remainder to sender
    transfer::public_transfer(coin, tx_context::sender(ctx));
  }
}`,
    simulation: {
      initialState: { wallets: { Alice: { sui: 10, color: "#A78BFA" }, Bob: { sui: 2, color: "#34D399" } }, objects: [] },
      steps: [
        { id: 1, action: "call_function", label: "Function Called", description: "transfer_sui() invoked with amount=5", icon: "⚡", detail: "Transaction submitted to the Sui execution engine. Gas budget allocated." },
        { id: 2, action: "access_object", label: "Object Accessed", description: "Alice's Coin<SUI> object loaded into memory", icon: "🔍", detail: "The coin object owned by Alice is fetched from the object store. Object ID validated." },
        { id: 3, action: "split", label: "Coin Split", description: "coin::split() creates a new Coin<SUI> of 5 SUI", icon: "✂️", detail: "The original coin object is mutated. A child coin object is created with value=5. Both share the same type descriptor." },
        { id: 4, action: "transfer", label: "Transfer Executed", description: "5 SUI moves from Alice → Bob", icon: "→", detail: "The new coin object's ownership field is updated from Alice's address to Bob's address. Immutable record written." },
        { id: 5, action: "commit", label: "State Committed", description: "Transaction finalized. Objects updated on-chain.", icon: "✓", detail: "All object mutations are committed atomically. If any step failed, the entire transaction would revert." },
      ],
      finalState: { wallets: { Alice: { sui: 5, color: "#A78BFA" }, Bob: { sui: 7, color: "#34D399" } }, objects: [] },
      explanation: {
        beginner: "Alice sent 5 SUI to Bob. Think of it like splitting a $10 bill — Alice kept $5 and gave $5 to Bob. The blockchain made sure Alice actually had enough money before sending.",
        advanced: "The Coin<SUI> object owned by Alice is passed by value into the function. coin::split() destructures it, creating a new Coin object with value=amount. transfer::public_transfer() updates the ownership field of the new coin to recipient's address. The original coin (now with value reduced) is returned to sender. All mutations are atomic.",
      },
      edgeLabel: "5 SUI",
    },
  },
  nft: {
    id: "nft", label: "Mint NFT", icon: "◈", color: "#F59E0B",
    code: `module playground::nft {
  use std::string::{Self, String};
  use sui::object::{Self, UID};
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};

  struct ArtNFT has key, store {
    id: UID,
    name: String,
    description: String,
    creator: address,
    edition: u64,
  }

  public entry fun mint_nft(
    name: vector<u8>,
    description: vector<u8>,
    edition: u64,
    ctx: &mut TxContext
  ) {
    let nft = ArtNFT {
      id: object::new(ctx),
      name: string::utf8(name),
      description: string::utf8(description),
      creator: tx_context::sender(ctx),
      edition,
    };
    transfer::public_transfer(nft, tx_context::sender(ctx));
  }
}`,
    simulation: {
      initialState: { wallets: { Alice: { sui: 10, color: "#A78BFA" }, Bob: { sui: 2, color: "#34D399" } }, objects: [] },
      steps: [
        { id: 1, action: "call_function", label: "Function Called", description: "mint_nft() invoked by Alice", icon: "⚡", detail: "Mint transaction initiated. ctx provides sender address and a unique transaction hash for ID generation." },
        { id: 2, action: "create_uid", label: "UID Generated", description: "object::new(ctx) generates a globally unique ID", icon: "🔑", detail: "The transaction context derives a deterministic, unique object ID. No two objects can share an ID on Sui." },
        { id: 3, action: "construct", label: "Struct Constructed", description: "ArtNFT object assembled in memory", icon: "🏗️", detail: "All fields are filled: name, description, creator (sender address), edition number. The 'key' ability means this can be a top-level owned object." },
        { id: 4, action: "transfer", label: "NFT Transferred to Owner", description: "ArtNFT object sent to Alice's address", icon: "→", detail: "transfer::public_transfer() sets ownership. Because ArtNFT has 'store', it can be transferred again later by Alice." },
        { id: 5, action: "commit", label: "NFT Exists On-Chain", description: "ArtNFT is now a permanent blockchain object", icon: "✓", detail: "The new object is committed to the Sui object store. It has its own ID and can be queried, transferred, or used in future transactions." },
      ],
      finalState: { wallets: { Alice: { sui: 9.5, color: "#A78BFA" }, Bob: { sui: 2, color: "#34D399" } }, objects: [{ name: "ArtNFT", subtitle: "Genesis #1", owner: "Alice", color: "#F59E0B", icon: "◈", id: "0xAB12...F4E1" }] },
      explanation: {
        beginner: "Alice created a new NFT called 'Genesis #1'. It's like minting a digital trading card — it now exists as a unique object on the blockchain that only Alice owns. She paid a small gas fee (~0.5 SUI) for the computation.",
        advanced: "mint_nft() constructs an ArtNFT struct with the 'key' ability, enabling it to exist as a top-level Sui object. object::new(ctx) derives a UID using the transaction hash and an incrementing counter. The struct also has 'store', granting transferability. After construction, the object is transferred to ctx.sender via public_transfer.",
      },
      edgeLabel: "Mint",
    },
  },
  counter: {
    id: "counter", label: "Counter Contract", icon: "⊕", color: "#10B981",
    code: `module playground::counter {
  use sui::object::{Self, UID};
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};

  struct Counter has key {
    id: UID,
    value: u64,
    owner: address,
  }

  public entry fun create_counter(ctx: &mut TxContext) {
    let counter = Counter {
      id: object::new(ctx),
      value: 0,
      owner: tx_context::sender(ctx),
    };
    transfer::share_object(counter);
  }

  public entry fun increment(
    counter: &mut Counter,
    ctx: &mut TxContext
  ) {
    counter.value = counter.value + 1;
  }

  public entry fun reset(counter: &mut Counter) {
    counter.value = 0;
  }
}`,
    simulation: {
      initialState: { wallets: { Alice: { sui: 10, color: "#A78BFA" }, Bob: { sui: 2, color: "#34D399" } }, objects: [] },
      steps: [
        { id: 1, action: "call_function", label: "create_counter() Called", description: "Alice creates a new shared counter object", icon: "⚡", detail: "Alice initiates the creation. The counter will be shared — meaning anyone can call increment() on it." },
        { id: 2, action: "create_uid", label: "Counter Object Created", description: "Counter { value: 0 } constructed with new UID", icon: "🏗️", detail: "A Counter struct is built with initial value=0. The 'key' ability allows it to exist as an on-chain object." },
        { id: 3, action: "share", label: "Object Shared", description: "transfer::share_object() makes it public", icon: "🌐", detail: "Unlike owned objects, shared objects can be accessed by ANYONE in any transaction. This enables permissionless counter incrementing." },
        { id: 4, action: "increment", label: "Bob Increments (×3)", description: "Bob calls increment() three times: 0 → 1 → 2 → 3", icon: "⊕", detail: "Each call passes &mut Counter, requiring consensus ordering. Multiple parties incrementing simultaneously would require sequencing." },
        { id: 5, action: "commit", label: "Final State: value = 3", description: "Counter object reflects all mutations", icon: "✓", detail: "The shared object is updated. Its state is visible to all. Any future transaction can read counter.value == 3." },
      ],
      finalState: { wallets: { Alice: { sui: 9.8, color: "#A78BFA" }, Bob: { sui: 1.8, color: "#34D399" } }, objects: [{ name: "Counter", subtitle: "value: 3", owner: "Shared", color: "#10B981", icon: "⊕", id: "0xCC44...8B2D" }] },
      explanation: {
        beginner: "Alice created a counter that anyone can use. Bob clicked the '+' button 3 times, and the counter went from 0 to 3. Because it's a 'shared object', anyone on the network can increment it — it's like a public scoreboard.",
        advanced: "The Counter struct uses transfer::share_object() instead of transfer::transfer(), making it a shared object. Shared objects require consensus ordering. The &mut Counter argument in increment() grants mutable access, and the value field is directly mutated. Each increment is a separate PTB (Programmable Transaction Block).",
      },
      edgeLabel: "+3",
    },
  },
  shared: {
    id: "shared", label: "Shared Object", icon: "⬡", color: "#EC4899",
    code: `module playground::marketplace {
  use sui::object::{Self, UID};
  use sui::coin::{Self, Coin};
  use sui::sui::SUI;
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};

  struct Listing has key, store {
    id: UID,
    item_name: String,
    price: u64,
    seller: address,
    active: bool,
  }

  struct Marketplace has key {
    id: UID,
    listings: u64,
    volume: u64,
  }

  public entry fun create_listing(
    marketplace: &mut Marketplace,
    item_name: vector<u8>,
    price: u64,
    ctx: &mut TxContext
  ) {
    marketplace.listings = marketplace.listings + 1;
  }

  public entry fun purchase(
    marketplace: &mut Marketplace,
    listing: Listing,
    payment: Coin<SUI>,
    ctx: &mut TxContext
  ) {
    let price = listing.price;
    assert!(coin::value(&payment) >= price, 0);
    transfer::public_transfer(payment, listing.seller);
    marketplace.volume = marketplace.volume + price;
  }
}`,
    simulation: {
      initialState: { wallets: { Alice: { sui: 10, color: "#A78BFA" }, Bob: { sui: 6, color: "#34D399" } }, objects: [{ name: "Listing", subtitle: "Pixel Sword: 3 SUI", owner: "Shared", color: "#EC4899", icon: "⬡", id: "0xDD55...7A3C" }] },
      steps: [
        { id: 1, action: "call_function", label: "purchase() Called", description: "Bob calls purchase() on the shared marketplace listing", icon: "⚡", detail: "Bob initiates the purchase. Both the shared Marketplace object and the Listing object are accessed in this transaction." },
        { id: 2, action: "access_object", label: "Listing Verified", description: "Listing { price: 3, active: true } loaded", icon: "🔍", detail: "The shared Listing object is read. Price verified. Active status confirmed. Seller address extracted for payment routing." },
        { id: 3, action: "validate", label: "Payment Validated", description: "assert!(coin::value >= 3) passes", icon: "✓", detail: "Bob's coin is checked to have sufficient value. If it were less than 3 SUI, the transaction would abort here with error code 0." },
        { id: 4, action: "transfer", label: "Payment Sent to Alice", description: "3 SUI transferred from Bob → Alice", icon: "→", detail: "The payment coin is transferred to listing.seller (Alice's address). The marketplace volume counter is incremented." },
        { id: 5, action: "commit", label: "Trade Complete", description: "Bob owns item. Alice received payment. Listing closed.", icon: "✓", detail: "All objects are committed atomically. The listing is consumed (deleted), Bob receives the item NFT, Alice receives the SUI." },
      ],
      finalState: { wallets: { Alice: { sui: 13, color: "#A78BFA" }, Bob: { sui: 3, color: "#34D399" } }, objects: [{ name: "Pixel Sword", subtitle: "Owned by Bob", owner: "Bob", color: "#EC4899", icon: "⬡", id: "0xDD55...7A3C" }] },
      explanation: {
        beginner: "Bob bought Alice's 'Pixel Sword' for 3 SUI using the marketplace. Alice listed the item, Bob clicked buy, and the blockchain automatically swapped the item for money — no middleman needed. Alice now has 13 SUI, Bob has 3 SUI and the sword.",
        advanced: "The Marketplace is a shared object, enabling permissionless access. The Listing object is passed by value into purchase() — consuming it (preventing double-spend). coin::value() checks the payment, then transfer::public_transfer() routes it to listing.seller. The entire trade is atomic.",
      },
      edgeLabel: "3 SUI",
    },
  },
};

// ─── GEMINI AI SIMULATOR ─────────────────────────────────────────────────────

async function simulateWithGemini(code, apiKey) {
  const prompt = `You are a Move language simulator for the Sui blockchain.
A developer has written this Move code:

\`\`\`move
${code}
\`\`\`

Return ONLY a valid JSON object (no markdown, no backticks, no explanation) with this exact structure:
{
  "initialState": {
    "wallets": {
      "Alice": { "sui": 10, "color": "#A78BFA" },
      "Bob": { "sui": 2, "color": "#34D399" }
    },
    "objects": []
  },
  "steps": [
    { "id": 1, "action": "call_function", "label": "Short label", "description": "One sentence.", "icon": "⚡", "detail": "Technical detail." }
  ],
  "finalState": {
    "wallets": {
      "Alice": { "sui": 8, "color": "#A78BFA" },
      "Bob": { "sui": 4, "color": "#34D399" }
    },
    "objects": []
  },
  "explanation": {
    "beginner": "Plain English explanation.",
    "advanced": "Technical Move explanation."
  },
  "edgeLabel": "2 SUI"
}

Rules:
- steps must have 4-6 items with sequential ids starting at 1
- icons must be single emojis
- wallet sui values must be realistic positive numbers
- base Alice balance is 10 SUI, Bob is 2 SUI unless the function implies otherwise
- objects array items need: name, subtitle, owner, color (#hex), icon (emoji), id fields
- edgeLabel should describe the main value/asset flow`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-14:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error (${res.status})`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── REGEX CODE PARSER ───────────────────────────────────────────────────────

function parseCodeParams(code, templateId) {
  const errors = [];
  const params = {};

  if (templateId === "transfer") {
    const splitMatch = code.match(/coin::split\s*\(\s*&mut\s+\w+\s*,\s*(\d+)\s*,/);
    params.amount = splitMatch ? parseInt(splitMatch[1]) : 5;
    if (!splitMatch) errors.push({ type: "warn", msg: "Could not find coin::split() amount — using default of 5 SUI." });
    else if (params.amount <= 0) errors.push({ type: "error", msg: "Transfer amount must be greater than 0." });
    else if (params.amount > 10) errors.push({ type: "error", msg: `Insufficient balance: Alice only has 10 SUI, can't send ${params.amount}.` });
    else if (params.amount === 10) errors.push({ type: "warn", msg: "Sending entire balance — Alice will have 0 SUI left." });

  } else if (templateId === "nft") {
    const editionMatch = code.match(/edition\s*[,=:]\s*(\d+)/);
    params.edition = editionMatch ? parseInt(editionMatch[1]) : 1;
    const nameMatch = code.match(/b"([^"]+)"/);
    params.nftName = nameMatch ? nameMatch[1] : "Genesis #1";

  } else if (templateId === "counter") {
    const incrementMatches = code.match(/increment\s*\(/g);
    params.increments = incrementMatches ? incrementMatches.length : 3;
    if (params.increments > 10) errors.push({ type: "warn", msg: "Many increments detected — capping visualization at 10." });

  } else if (templateId === "shared") {
    const priceMatch = code.match(/price\s*[:=,]\s*(\d+)/);
    params.price = priceMatch ? parseInt(priceMatch[1]) : 3;
    if (params.price > 6) errors.push({ type: "error", msg: `Price too high: Bob only has 6 SUI, can't pay ${params.price}.` });
  }

  return { params, errors };
}

function buildSimulationFromParams(templateId, params) {
  const base = TEMPLATES[templateId].simulation;

  if (templateId === "transfer") {
    const { amount = 5 } = params;
    const aliceAfter = parseFloat((10 - amount).toFixed(2));
    const bobAfter = parseFloat((2 + amount).toFixed(2));
    return {
      ...base,
      steps: base.steps.map((s) =>
        s.action === "split" ? { ...s, description: `coin::split() creates a new Coin<SUI> of ${amount} SUI` }
        : s.action === "transfer" ? { ...s, description: `${amount} SUI moves from Alice → Bob` }
        : s.action === "call_function" ? { ...s, description: `transfer_sui() invoked with amount=${amount}` }
        : s
      ),
      finalState: { wallets: { Alice: { sui: aliceAfter, color: "#A78BFA" }, Bob: { sui: bobAfter, color: "#34D399" } }, objects: [] },
      edgeLabel: `${amount} SUI`,
      explanation: {
        beginner: `Alice sent ${amount} SUI to Bob. Alice now has ${aliceAfter} SUI and Bob has ${bobAfter} SUI. The blockchain verified Alice had enough before sending.`,
        advanced: `coin::split() destructures Alice's Coin<SUI>, creating a child coin of value=${amount}. transfer::public_transfer() updates the ownership field to Bob's address. Alice's remaining coin (${aliceAfter} SUI) is returned. All mutations are atomic.`,
      },
    };
  }

  if (templateId === "nft") {
    const { edition = 1, nftName = "Genesis #1" } = params;
    return {
      ...base,
      steps: base.steps.map((s) =>
        s.action === "construct" ? { ...s, description: `ArtNFT { name: "${nftName}", edition: ${edition} } assembled` }
        : s.action === "call_function" ? { ...s, description: `mint_nft() invoked — minting "${nftName}" edition #${edition}` }
        : s
      ),
      finalState: { wallets: { Alice: { sui: 9.5, color: "#A78BFA" }, Bob: { sui: 2, color: "#34D399" } }, objects: [{ name: "ArtNFT", subtitle: `${nftName} #${edition}`, owner: "Alice", color: "#F59E0B", icon: "◈", id: "0xAB12...F4E1" }] },
      edgeLabel: "Mint",
      explanation: {
        beginner: `Alice minted a new NFT called "${nftName}" (edition #${edition}). It now lives on the blockchain as a unique object only Alice owns.`,
        advanced: `ArtNFT struct constructed with name="${nftName}", edition=${edition}. object::new(ctx) derives a UID. The 'key' ability enables top-level ownership. transfer::public_transfer() assigns it to ctx.sender.`,
      },
    };
  }

  if (templateId === "counter") {
    const capped = Math.min(params.increments || 3, 10);
    return {
      ...base,
      steps: base.steps.map((s) =>
        s.action === "increment" ? { ...s, label: `Bob Increments (×${capped})`, description: `Bob calls increment() ${capped} times: 0 → ${capped}` }
        : s.action === "commit" ? { ...s, label: `Final State: value = ${capped}`, description: `Counter object reflects all ${capped} mutations` }
        : s
      ),
      finalState: { wallets: { Alice: { sui: 9.8, color: "#A78BFA" }, Bob: { sui: parseFloat((2 - capped * 0.06).toFixed(2)), color: "#34D399" } }, objects: [{ name: "Counter", subtitle: `value: ${capped}`, owner: "Shared", color: "#10B981", icon: "⊕", id: "0xCC44...8B2D" }] },
      edgeLabel: `+${capped}`,
      explanation: {
        beginner: `Alice created a shared counter. Bob incremented it ${capped} times, bringing the value from 0 to ${capped}. Anyone on the network can increment it.`,
        advanced: `Counter is a shared object requiring consensus ordering. Each of the ${capped} increment() calls passes &mut Counter, directly mutating the value field. Each call is a separate PTB.`,
      },
    };
  }

  if (templateId === "shared") {
    const { price = 3 } = params;
    const aliceAfter = parseFloat((10 + price).toFixed(2));
    const bobAfter = parseFloat((6 - price).toFixed(2));
    return {
      ...base,
      steps: base.steps.map((s) =>
        s.action === "validate" ? { ...s, description: `assert!(coin::value >= ${price}) passes` }
        : s.action === "transfer" ? { ...s, description: `${price} SUI transferred from Bob → Alice` }
        : s
      ),
      finalState: { wallets: { Alice: { sui: aliceAfter, color: "#A78BFA" }, Bob: { sui: bobAfter, color: "#34D399" } }, objects: [{ name: "Pixel Sword", subtitle: "Owned by Bob", owner: "Bob", color: "#EC4899", icon: "⬡", id: "0xDD55...7A3C" }] },
      edgeLabel: `${price} SUI`,
      explanation: {
        beginner: `Bob bought Alice's item for ${price} SUI. Alice now has ${aliceAfter} SUI and Bob has ${bobAfter} SUI plus the item. Trustless — no middleman.`,
        advanced: `The Listing is consumed by value preventing double-spend. coin::value() validates payment >= ${price}. transfer::public_transfer() routes to listing.seller atomically. Volume counter incremented on the shared Marketplace object.`,
      },
    };
  }

  return base;
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

const PlayIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><polygon points="4,2 14,8 4,14" /></svg>;
const StepBackIcon = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="1" width="3" height="12" rx="1" /><polygon points="13,1 5,7 13,13" /></svg>;
const StepForwardIcon = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="10" y="1" width="3" height="12" rx="1" /><polygon points="1,1 9,7 1,13" /></svg>;
const ReplayIcon = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 7a5 5 0 1 0 1-3L1 3" strokeLinecap="round" /><polyline points="1,1 1,4 4,4" strokeLinecap="round" strokeLinejoin="round" /></svg>;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ─── SYNTAX HIGHLIGHTER ──────────────────────────────────────────────────────

function highlight(code) {
  const keywords = ["module","use","struct","public","entry","fun","let","if","else","return","has","key","store","copy","drop","mut","Self","assert"];
  const types = ["u64","u8","u128","bool","address","vector","String","Coin","SUI","UID","TxContext"];
  const builtins = ["transfer","coin","object","tx_context","string"];
  let r = code.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  r = r.replace(/(\/\/[^\n]*)/g,'<span style="color:#6B7280">$1</span>');
  r = r.replace(/("(?:[^"\\]|\\.)*")/g,'<span style="color:#FCD34D">$1</span>');
  r = r.replace(/\b(\d+)\b/g,'<span style="color:#F9A8D4">$1</span>');
  keywords.forEach((kw) => { r = r.replace(new RegExp(`\\b(${kw})\\b`,"g"),'<span style="color:#818CF8">$1</span>'); });
  types.forEach((t) => { r = r.replace(new RegExp(`\\b(${t})\\b`,"g"),'<span style="color:#34D399">$1</span>'); });
  builtins.forEach((b) => { r = r.replace(new RegExp(`\\b(${b})\\b`,"g"),'<span style="color:#60A5FA">$1</span>'); });
  return r;
}

// ─── GEMINI KEY PANEL ────────────────────────────────────────────────────────

function GeminiKeyPanel({ geminiKey, onSave, onClose }) {
  const [input, setInput] = useState(geminiKey);

  const handleSave = () => {
    try { localStorage.setItem("gemini_key", input); } catch (_) {}
    onSave(input);
    onClose();
  };

  const handleClear = () => {
    try { localStorage.removeItem("gemini_key"); } catch (_) {}
    onSave("");
    setInput("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(7,13,26,0.88)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "16px", padding: "28px", width: "420px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", animation: "fadeIn 0.2s ease" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: "16px", color: "#F1F5F9", marginBottom: "6px" }}>✦ Enable AI Simulation</div>
          <div style={{ color: "#64748B", fontSize: "12px", lineHeight: 1.6 }}>
            Add your free Gemini Flash 2.5 key to simulate <strong style={{ color: "#94A3B8" }}>any</strong> custom Move function you write — not just the built-in templates.
          </div>
        </div>

        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", background: "rgba(99,102,241,0.1)", border: "1px solid #6366F140", color: "#818CF8", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
          <span>🔑 Get a free key at Google AI Studio</span>
          <span style={{ opacity: 0.6 }}>→</span>
        </a>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ color: "#475569", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Your Gemini API Key</label>
          <input
            type="password" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && input.trim() && handleSave()}
            placeholder="AIza..."
            style={{ background: "#070D1A", border: "1px solid #1E293B", borderRadius: "8px", padding: "10px 12px", color: "#E2E8F0", fontSize: "12px", fontFamily: "'JetBrains Mono',monospace", outline: "none", width: "100%" }}
          />
          <div style={{ color: "#475569", fontSize: "10px", lineHeight: 1.5 }}>
            🔒 Stored in your browser only. Sent directly to Google's API — never to any other server.
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleSave} disabled={!input.trim()} style={{ flex: 1, padding: "10px", background: input.trim() ? "#6366F1" : "#1E293B", color: input.trim() ? "#fff" : "#475569", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: input.trim() ? "pointer" : "not-allowed", transition: "all 0.2s ease" }}>
            Save Key
          </button>
          {geminiKey && (
            <button onClick={handleClear} style={{ padding: "10px 14px", background: "transparent", color: "#F87171", border: "1px solid #F8717140", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>
              Clear
            </button>
          )}
          <button onClick={onClose} style={{ padding: "10px 14px", background: "transparent", color: "#64748B", border: "1px solid #1E293B", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VISUALIZATION ───────────────────────────────────────────────────────────

function VisualizationCanvas({ template, sim, currentStep, isComplete }) {
  const state = currentStep === 0 ? sim.initialState : (isComplete || currentStep >= sim.steps.length) ? sim.finalState : sim.initialState;
  const activeStep = sim.steps[currentStep - 1];
  const walletEntries = Object.entries(state.wallets);

  const getHighlight = (name) => {
    if (!activeStep) return false;
    const a = activeStep.action;
    return a === "transfer" || a === "split" || (a === "access_object" && name === "Alice");
  };

  const showEdge = currentStep >= 4 || isComplete;
  const edgeProgress = isComplete ? 1 : currentStep >= 4 ? (currentStep - 3) / 2 : 0;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #1E293B 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.4 }} />
      <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: `radial-gradient(circle, ${template.color}18 0%, transparent 70%)`, top: "50%", left: "50%", transform: "translate(-50%, -50%)", transition: "all 0.8s ease" }} />

      {state.objects.length > 0 && (
        <div style={{ position: "relative", zIndex: 2, display: "flex", gap: "12px" }}>
          {state.objects.map((obj, i) => <ObjectNode key={i} obj={obj} visible={isComplete || currentStep >= 4} />)}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center" }}>
        {walletEntries.map(([name, data], i) => (
          <div key={name} style={{ display: "flex", alignItems: "center" }}>
            <WalletNode name={name} data={data} highlighted={getHighlight(name)} currentStep={currentStep} isComplete={isComplete} originalData={sim.initialState.wallets[name]} />
            {i < walletEntries.length - 1 && <TransferEdge visible={showEdge} progress={edgeProgress} color={template.color} label={sim.edgeLabel} isComplete={isComplete} />}
          </div>
        ))}
      </div>

      {activeStep && (
        <div style={{ position: "relative", zIndex: 2, background: "rgba(15,23,42,0.9)", border: `1px solid ${template.color}40`, borderRadius: "12px", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px", animation: "fadeIn 0.3s ease", maxWidth: "360px", textAlign: "center" }}>
          <span style={{ fontSize: "18px" }}>{activeStep.icon}</span>
          <div>
            <div style={{ color: template.color, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{activeStep.label}</div>
            <div style={{ color: "#94A3B8", fontSize: "12px", marginTop: "2px" }}>{activeStep.description}</div>
          </div>
        </div>
      )}

      {isComplete && !activeStep && (
        <div style={{ position: "relative", zIndex: 2, background: "rgba(16,185,129,0.1)", border: "1px solid #10B98140", borderRadius: "12px", padding: "10px 20px", color: "#34D399", fontSize: "13px", fontWeight: 600 }}>
          ✓ Transaction Complete
        </div>
      )}
    </div>
  );
}

function WalletNode({ name, data, highlighted, currentStep, isComplete, originalData }) {
  const showUpdated = isComplete || currentStep >= 4;
  const changed = showUpdated && originalData && data.sui !== originalData.sui;
  const diff = originalData ? parseFloat((data.sui - originalData.sui).toFixed(2)) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", transition: "all 0.5s ease" }}>
      <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: `radial-gradient(135deg, ${data.color}30 0%, ${data.color}10 100%)`, border: `2px solid ${highlighted ? data.color : data.color + "50"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", boxShadow: highlighted ? `0 0 24px ${data.color}60` : "none", transition: "all 0.4s ease", animation: highlighted ? "pulse 1s ease infinite" : "none" }}>
        {name === "Alice" ? "👩" : "👨"}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 700 }}>{name}</div>
        <div style={{ color: changed ? (diff > 0 ? "#34D399" : "#F87171") : "#64748B", fontSize: "12px", marginTop: "2px", transition: "color 0.5s ease", fontFamily: "'JetBrains Mono',monospace" }}>
          {showUpdated ? data.sui : (originalData ? originalData.sui : data.sui)} SUI
          {changed && <span style={{ marginLeft: "4px", fontSize: "10px" }}>{diff > 0 ? `+${diff}` : diff}</span>}
        </div>
      </div>
    </div>
  );
}

function ObjectNode({ obj, visible }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(-16px) scale(0.8)", transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
      <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: `linear-gradient(135deg, ${obj.color}25, ${obj.color}10)`, border: `1.5px solid ${obj.color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", boxShadow: `0 0 20px ${obj.color}30` }}>
        {obj.icon}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#E2E8F0", fontSize: "11px", fontWeight: 700 }}>{obj.name}</div>
        <div style={{ color: "#64748B", fontSize: "10px" }}>{obj.subtitle}</div>
        <div style={{ color: obj.color, fontSize: "9px", opacity: 0.8 }}>→ {obj.owner}</div>
      </div>
    </div>
  );
}

function TransferEdge({ visible, progress, color, label, isComplete }) {
  return (
    <div style={{ position: "relative", width: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, ${color}20, ${color}60, ${color}20)`, opacity: visible ? 1 : 0, transition: "opacity 0.5s ease" }} />
      {visible && <div style={{ position: "absolute", left: `${progress * 85}%`, width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 12px ${color}`, transition: "left 0.6s cubic-bezier(0.4,0,0.2,1)", opacity: isComplete ? 0 : 1 }} />}
      {visible && <div style={{ position: "absolute", top: "-18px", color, fontSize: "10px", fontWeight: 700, background: "rgba(15,23,42,0.8)", padding: "1px 6px", borderRadius: "4px", border: `1px solid ${color}30`, whiteSpace: "nowrap" }}>{label}</div>}
      {isComplete && <div style={{ position: "absolute", right: "0", color, fontSize: "16px", opacity: 0.8 }}>›</div>}
    </div>
  );
}

// ─── TIMELINE ────────────────────────────────────────────────────────────────

function Timeline({ steps, currentStep, templateColor, onStepClick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const isDone = currentStep > step.id;
        return (
          <button key={step.id} onClick={() => onStepClick(step.id)} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 10px", borderRadius: "8px", background: isActive ? `${templateColor}15` : isDone ? "rgba(30,41,59,0.4)" : "transparent", border: `1px solid ${isActive ? templateColor + "50" : "transparent"}`, cursor: "pointer", textAlign: "left", transition: "all 0.3s ease" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: isActive ? templateColor : isDone ? "#1E293B" : "#0F172A", border: `1.5px solid ${isActive ? templateColor : isDone ? templateColor + "60" : "#1E293B"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "9px", transition: "all 0.3s ease", boxShadow: isActive ? `0 0 10px ${templateColor}60` : "none" }}>
              {isDone ? <span style={{ color: templateColor, fontSize: "10px" }}>✓</span> : <span style={{ color: isActive ? "#0F172A" : "#475569", fontWeight: 700 }}>{step.id}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: isActive ? "#E2E8F0" : isDone ? "#64748B" : "#475569", fontSize: "11px", fontWeight: isActive ? 700 : 500, lineHeight: 1.2 }}>{step.icon} {step.label}</div>
              {isActive && <div style={{ color: "#64748B", fontSize: "10px", marginTop: "3px", lineHeight: 1.4, animation: "fadeIn 0.3s ease" }}>{step.detail}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── STATE PANEL ─────────────────────────────────────────────────────────────

function StatePanel({ sim, template, currentStep, isComplete }) {
  const showAfter = isComplete || currentStep >= sim.steps.length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {["Before", "After"].map((label) => {
          const stateData = label === "Before" ? sim.initialState : sim.finalState;
          const isAfter = label === "After";
          return (
            <div key={label} style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${isAfter && showAfter ? template.color + "40" : "#1E293B"}`, borderRadius: "10px", padding: "10px", opacity: isAfter && !showAfter ? 0.35 : 1, transition: "all 0.5s ease" }}>
              <div style={{ color: isAfter && showAfter ? template.color : "#475569", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
              {Object.entries(stateData.wallets).map(([name, data]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ color: data.color, fontSize: "11px", fontWeight: 600 }}>{name}</span>
                  <span style={{ color: "#94A3B8", fontSize: "11px", fontFamily: "'JetBrains Mono',monospace" }}>{data.sui} SUI</span>
                </div>
              ))}
              {stateData.objects.map((obj, i) => (
                <div key={i} style={{ marginTop: "6px", padding: "6px", background: `${obj.color}10`, border: `1px solid ${obj.color}30`, borderRadius: "6px" }}>
                  <div style={{ color: obj.color, fontSize: "10px", fontWeight: 700 }}>{obj.icon} {obj.name}</div>
                  <div style={{ color: "#64748B", fontSize: "9px" }}>{obj.subtitle}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {showAfter && (
        <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid #10B98120", borderRadius: "8px", padding: "8px 10px", animation: "fadeIn 0.5s ease" }}>
          <div style={{ color: "#34D399", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Changes</div>
          {Object.entries(sim.finalState.wallets).map(([name, data]) => {
            const orig = sim.initialState.wallets[name];
            if (!orig) return null;
            const diff = parseFloat((data.sui - orig.sui).toFixed(2));
            if (diff === 0) return null;
            return (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                <span style={{ color: "#94A3B8", fontSize: "11px" }}>{name}</span>
                <span style={{ color: diff > 0 ? "#34D399" : "#F87171", fontSize: "11px", fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{diff > 0 ? "+" : ""}{diff} SUI</span>
              </div>
            );
          })}
          {sim.finalState.objects.map((obj, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
              <span style={{ color: "#94A3B8", fontSize: "11px" }}>{obj.name}</span>
              <span style={{ color: template.color, fontSize: "11px" }}>→ {obj.owner}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EXPLANATION PANEL ───────────────────────────────────────────────────────

function ExplanationPanel({ sim, template, isComplete, currentStep }) {
  const [mode, setMode] = useState("beginner");
  const show = isComplete || currentStep > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", background: "rgba(15,23,42,0.8)", border: "1px solid #1E293B", borderRadius: "8px", padding: "3px", gap: "2px" }}>
        {["beginner", "advanced"].map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "5px 8px", borderRadius: "6px", background: mode === m ? template.color : "transparent", color: mode === m ? "#0F172A" : "#64748B", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", border: "none", transition: "all 0.2s ease" }}>
            {m === "beginner" ? "🟢 Simple" : "🔵 Technical"}
          </button>
        ))}
      </div>
      <div style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${template.color}25`, borderRadius: "10px", padding: "12px", minHeight: "80px", opacity: show ? 1 : 0.3, transition: "opacity 0.5s ease" }}>
        {show
          ? <p style={{ color: "#CBD5E1", fontSize: "12px", lineHeight: 1.6, margin: 0, animation: "fadeIn 0.4s ease" }}>{sim.explanation?.[mode] || "Explanation not available."}</p>
          : <p style={{ color: "#475569", fontSize: "12px", lineHeight: 1.6, margin: 0 }}>Run the simulation to see an explanation...</p>
        }
      </div>
    </div>
  );
}

// ─── CODE EDITOR ─────────────────────────────────────────────────────────────

function CodeEditor({ code, onChange, templateColor, onRun, isRunning, parseErrors, aiMode }) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", gap: "5px" }}>
          {["#F87171","#FBBF24","#34D399"].map((c) => <div key={c} style={{ width: "9px", height: "9px", borderRadius: "50%", background: c, opacity: 0.7 }} />)}
        </div>
        <span style={{ color: "#475569", fontSize: "10px", fontFamily: "monospace", flex: 1 }}>main.move</span>
        <div style={{ color: "#64748B", fontSize: "9px", background: "#1E293B", padding: "2px 6px", borderRadius: "4px" }}>Move</div>
      </div>

      <div style={{ flex: 1, position: "relative", background: "rgba(7,13,26,0.8)", border: `1px solid ${isFocused ? templateColor + "40" : "#1E293B"}`, borderRadius: "10px", overflow: "hidden", transition: "border-color 0.3s ease" }}>
        <div style={{ position: "absolute", inset: 0, padding: "14px", fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", fontSize: "11px", lineHeight: "18px", color: "#E2E8F0", whiteSpace: "pre", overflow: "auto", pointerEvents: "none", zIndex: 1 }} dangerouslySetInnerHTML={{ __html: highlight(code) }} />
        <textarea value={code} onChange={(e) => onChange(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} spellCheck={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", padding: "14px", fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", fontSize: "11px", lineHeight: "18px", color: "transparent", caretColor: templateColor, background: "transparent", border: "none", outline: "none", resize: "none", zIndex: 2, whiteSpace: "pre", overflow: "auto" }} />
      </div>

      {parseErrors.map((e, i) => (
        <div key={i} style={{ padding: "7px 10px", borderRadius: "7px", fontSize: "11px", background: e.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)", border: `1px solid ${e.type === "error" ? "#F8717140" : "#FBBF2440"}`, color: e.type === "error" ? "#F87171" : "#FCD34D", lineHeight: 1.4 }}>
          {e.type === "error" ? "✕ " : "⚠ "}{e.msg}
        </div>
      ))}

      {aiMode && (
        <div style={{ padding: "6px 10px", borderRadius: "7px", fontSize: "10px", background: "rgba(99,102,241,0.1)", border: "1px solid #6366F140", color: "#818CF8", display: "flex", alignItems: "center", gap: "6px" }}>
          ✦ Simulated by Gemini Flash 2.5
        </div>
      )}

      <button onClick={onRun} disabled={isRunning} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 16px", background: isRunning ? `${templateColor}40` : templateColor, color: "#0F172A", borderRadius: "8px", border: "none", cursor: isRunning ? "not-allowed" : "pointer", fontWeight: 800, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.3s ease", boxShadow: isRunning ? "none" : `0 4px 20px ${templateColor}50` }}>
        {isRunning
          ? <><div style={{ width: "12px", height: "12px", border: "2px solid #0F172A40", borderTopColor: "#0F172A", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />Simulating...</>
          : <><PlayIcon />Run Simulation</>
        }
      </button>
    </div>
  );
}

// ─── HELPER COMPONENTS ───────────────────────────────────────────────────────

function Section({ label, color, children }) {
  return (
    <div>
      <div style={{ color: "#475569", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: color }} />{label}
      </div>
      {children}
    </div>
  );
}

function ControlBtn({ onClick, disabled, children, title, active }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: active ? "#1E293B" : "transparent", border: "1px solid #1E293B", borderRadius: "6px", color: disabled ? "#1E293B" : "#64748B", cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s ease" }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.color = "#E2E8F0")}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.color = "#64748B")}>
      {children}
    </button>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function MovePlayground() {
  const [selectedTemplate, setSelectedTemplate] = useState("transfer");
  const [code, setCode] = useState(TEMPLATES.transfer.code);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => { try { return localStorage.getItem("gemini_key") || ""; } catch { return ""; } });
  const [parseErrors, setParseErrors] = useState([]);
  const [aiMode, setAiMode] = useState(false);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [dynamicSim, setDynamicSim] = useState(null);
  const autoPlayRef = useRef(null);

  const template = TEMPLATES[selectedTemplate];
  const activeSim = dynamicSim || template.simulation;
  const totalSteps = activeSim.steps.length;

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => runSimulation(), 1200);
    return () => clearTimeout(t);
  }, []);

  const clearAutoPlay = () => {
    if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; }
    setIsAutoPlaying(false);
  };

  const selectTemplate = (id) => {
    clearAutoPlay();
    setSelectedTemplate(id);
    setCode(TEMPLATES[id].code);
    setCurrentStep(0);
    setIsRunning(false);
    setIsComplete(false);
    setDynamicSim(null);
    setParseErrors([]);
    setAiMode(false);
  };

  const runSimulation = async () => {
    if (isRunning) return;
    clearAutoPlay();
    setIsRunning(true);
    setIsComplete(false);
    setCurrentStep(0);
    setAiMode(false);
    setParseErrors([]);

    // Detect unknown/custom functions
    const knownFunctions = {
      transfer: ["transfer_sui"],
      nft: ["mint_nft"],
      counter: ["create_counter", "increment", "reset"],
      shared: ["create_listing", "purchase"],
    };
    const funMatches = [...code.matchAll(/fun\s+(\w+)\s*\(/g)].map((m) => m[1]);
    const unknown = funMatches.filter((f) => !knownFunctions[selectedTemplate]?.includes(f));
    const hasCustomCode = unknown.length > 0;

    let simToUse = null;

    if (hasCustomCode && geminiKey) {
      // AI path via Gemini
      try {
        const aiResult = await simulateWithGemini(code, geminiKey);
        simToUse = {
          initialState: aiResult.initialState,
          steps: aiResult.steps,
          finalState: aiResult.finalState,
          explanation: aiResult.explanation,
          edgeLabel: aiResult.edgeLabel || "→",
        };
        setAiMode(true);
      } catch (e) {
        setParseErrors([{ type: "error", msg: `Gemini error: ${e.message}` }]);
        setIsRunning(false);
        return;
      }
    } else if (hasCustomCode && !geminiKey) {
      setParseErrors([{ type: "warn", msg: `Custom function "${unknown[0]}" detected. Add your free Gemini key to simulate it with AI!` }]);
      setIsRunning(false);
      return;
    } else {
      // Regex parser path
      const { params, errors } = parseCodeParams(code, selectedTemplate);
      setParseErrors(errors);
      if (errors.some((e) => e.type === "error")) { setIsRunning(false); return; }
      simToUse = buildSimulationFromParams(selectedTemplate, params);
    }

    setDynamicSim(simToUse);
    await sleep(400);

    for (let i = 1; i <= simToUse.steps.length; i++) {
      setCurrentStep(i);
      await sleep(700 / speed);
    }

    setIsComplete(true);
    setIsRunning(false);
  };

  const handleReset = () => {
    clearAutoPlay();
    setCurrentStep(0);
    setIsComplete(false);
    setIsRunning(false);
    setDynamicSim(null);
    setParseErrors([]);
    setAiMode(false);
  };

  const handleStepBack = () => {
    clearAutoPlay();
    if (currentStep > 0) { setCurrentStep((s) => s - 1); setIsComplete(false); }
  };

  const handleStepForward = () => {
    clearAutoPlay();
    if (currentStep < totalSteps) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next >= totalSteps) setIsComplete(true);
    }
  };

  const handleReplay = () => {
    if (isAutoPlaying) { clearAutoPlay(); return; }
    handleReset();
    setTimeout(() => runSimulation(), 300);
  };

  const handleStepClick = (stepId) => {
    clearAutoPlay();
    setCurrentStep(stepId);
    setIsComplete(stepId >= totalSteps);
  };

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#070D1A", color: "#E2E8F0", fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 16px #00D4FF60; } 50% { box-shadow: 0 0 32px #00D4FF80; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
      `}</style>

      {showKeyPanel && <GeminiKeyPanel geminiKey={geminiKey} onSave={setGeminiKey} onClose={() => setShowKeyPanel(false)} />}

      {/* HEADER */}
      <header style={{ padding: "16px 24px", borderBottom: "1px solid #0F172A", display: "flex", alignItems: "center", gap: "16px", background: "rgba(7,13,26,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", background: `linear-gradient(135deg, ${template.color}, ${template.color}80)`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", boxShadow: `0 0 16px ${template.color}40`, transition: "all 0.4s ease" }}>◈</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "-0.02em", color: "#F1F5F9" }}>Move Playground</div>
            <div style={{ color: "#475569", fontSize: "10px", letterSpacing: "0.05em" }}>SUI BLOCKCHAIN SIMULATOR</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: "6px" }}>
          {Object.values(TEMPLATES).map((t) => (
            <button key={t.id} onClick={() => selectTemplate(t.id)} style={{ padding: "5px 12px", borderRadius: "20px", background: selectedTemplate === t.id ? `${t.color}20` : "transparent", border: `1px solid ${selectedTemplate === t.id ? t.color + "60" : "#1E293B"}`, color: selectedTemplate === t.id ? t.color : "#64748B", fontSize: "11px", fontWeight: selectedTemplate === t.id ? 700 : 500, cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <button onClick={() => setShowKeyPanel(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", background: geminiKey ? "rgba(99,102,241,0.15)" : "transparent", border: `1px solid ${geminiKey ? "#6366F160" : "#1E293B"}`, color: geminiKey ? "#818CF8" : "#64748B", fontSize: "11px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s ease" }}>
          {geminiKey ? "✦ AI On" : "✦ Add Gemini Key"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#475569", fontSize: "10px" }}>Speed</span>
          <div style={{ display: "flex", background: "#0F172A", border: "1px solid #1E293B", borderRadius: "6px", overflow: "hidden" }}>
            {[0.5, 1, 2].map((s) => (
              <button key={s} onClick={() => setSpeed(s)} style={{ padding: "3px 8px", background: speed === s ? "#1E293B" : "transparent", color: speed === s ? "#E2E8F0" : "#475569", fontSize: "10px", fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s ease" }}>{s}×</button>
            ))}
          </div>
        </div>
      </header>

      {/* HERO */}
      <div style={{ padding: "20px 24px 16px", textAlign: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em", background: `linear-gradient(135deg, #F1F5F9 40%, ${template.color})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "6px", transition: "all 0.5s ease" }}>
          Understand Move by Seeing It
        </h1>
        <p style={{ color: "#64748B", fontSize: "13px" }}>
          Visualize how Sui transactions and objects behave in real time
          {!geminiKey && (
            <span onClick={() => setShowKeyPanel(true)} style={{ color: "#6366F1", marginLeft: "8px", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>
              + Add Gemini key for AI simulation of custom functions
            </span>
          )}
        </p>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "320px 1fr 300px", gap: "1px", background: "#0F172A", margin: "0 16px 16px", borderRadius: "16px", overflow: "hidden", border: "1px solid #1E293B", minHeight: "600px" }}>

        {/* LEFT: Code Editor */}
        <div style={{ background: "#070D1A", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", borderRight: "1px solid #0F172A" }}>
          <CodeEditor code={code} onChange={setCode} templateColor={template.color} onRun={runSimulation} isRunning={isRunning} parseErrors={parseErrors} aiMode={aiMode} />
        </div>

        {/* CENTER: Visualization */}
        <div style={{ background: "#070D1A", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <VisualizationCanvas template={template} sim={activeSim} currentStep={currentStep} isComplete={isComplete} />
          </div>
          <div style={{ borderTop: "1px solid #0F172A", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(7,13,26,0.8)" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              <ControlBtn onClick={handleStepBack} disabled={currentStep === 0} title="Step Back"><StepBackIcon /></ControlBtn>
              <ControlBtn onClick={handleStepForward} disabled={currentStep >= totalSteps} title="Step Forward"><StepForwardIcon /></ControlBtn>
              <ControlBtn onClick={handleReplay} title="Replay" active={isAutoPlaying}><ReplayIcon /></ControlBtn>
            </div>
            <div style={{ flex: 1, height: "4px", background: "#0F172A", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(currentStep / totalSteps) * 100}%`, background: `linear-gradient(90deg, ${template.color}80, ${template.color})`, borderRadius: "2px", transition: "width 0.4s ease" }} />
            </div>
            <span style={{ color: "#475569", fontSize: "10px", fontFamily: "monospace", whiteSpace: "nowrap" }}>{currentStep}/{totalSteps}</span>
            <button onClick={handleReset} style={{ color: "#475569", background: "transparent", border: "none", cursor: "pointer", fontSize: "10px", padding: "4px 8px", borderRadius: "4px" }}
              onMouseEnter={(e) => e.target.style.color = "#94A3B8"} onMouseLeave={(e) => e.target.style.color = "#475569"}>
              Reset
            </button>
          </div>
        </div>

        {/* RIGHT: State + Timeline + Explanation */}
        <div style={{ background: "#070D1A", borderLeft: "1px solid #0F172A", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <Section label="Object State" color={template.color}>
              <StatePanel sim={activeSim} template={template} currentStep={currentStep} isComplete={isComplete} />
            </Section>
            <Section label="Execution Timeline" color={template.color}>
              <Timeline steps={activeSim.steps} currentStep={currentStep} templateColor={template.color} onStepClick={handleStepClick} />
            </Section>
            <Section label="What Happened" color={template.color}>
              <ExplanationPanel sim={activeSim} template={template} isComplete={isComplete} currentStep={currentStep} />
            </Section>
          </div>
        </div>

      </div>
    </div>
  );
}

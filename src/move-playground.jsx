import { useState, useEffect, useRef } from "react";

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

const TEMPLATES = {
  transfer: {
    id: "transfer", label: "Transfer SUI", icon: "⟶", color: "#00D4FF",
    code: `module suimulate::transfer {
  use sui::coin::{Self, Coin};
  use sui::sui::SUI;
  use sui::transfer;

  public entry fun transfer_sui(
    mut coin: Coin<SUI>,
    ctx: &mut TxContext
  ) {
    // Amount to send to Bob
    let amount: u64 = 5;

    // Split off the amount
    let payment = coin::split(&mut coin, amount, ctx);

    // Send to Bob
    transfer::public_transfer(payment, @bob);

    // Return remainder to Alice
    transfer::public_transfer(coin, tx_context::sender(ctx));
  }
}`,
    simulation: {
      layout: "transfer",
      initialState: {
        wallets: { Alice: { sui: 10, color: "#A78BFA" }, Bob: { sui: 2, color: "#34D399" } },
        objects: [],
      },
      steps: [
        { id: 1, action: "call_function",  label: "Function Called",   description: "transfer_sui() invoked by Alice",                        icon: "⚡",  detail: "Transaction submitted to the Sui execution engine. Gas budget allocated from Alice's account." },
        { id: 2, action: "access_object",  label: "Coin Loaded",        description: "Alice's Coin<SUI> object fetched from object store",     icon: "🔍",  detail: "The coin object owned by Alice is loaded into the transaction context. Object ID and ownership validated." },
        { id: 3, action: "split",          label: "Coin Split",          description: "coin::split() carves out a new Coin<SUI> of 5 SUI",     icon: "✂️", detail: "Original coin mutated. A child coin object with value=5 is created. Both share the same SUI type descriptor." },
        { id: 4, action: "transfer",       label: "Transfer Executed",   description: "5 SUI moves from Alice → Bob",                          icon: "→",   detail: "The child coin's ownership field is updated to Bob's address. Alice's remainder coin is returned to sender." },
        { id: 5, action: "commit",         label: "State Committed",     description: "Transaction finalized. Balances updated on-chain.",     icon: "✓",   detail: "All mutations committed atomically. If any step had failed, the entire transaction would have reverted." },
      ],
      finalState: {
        wallets: { Alice: { sui: 5, color: "#A78BFA" }, Bob: { sui: 7, color: "#34D399" } },
        objects: [],
      },
      explanation: {
        beginner: "Alice sent 5 SUI to Bob. Think of it like splitting a $10 bill — Alice kept $5 and handed $5 to Bob. The blockchain verified Alice had enough before allowing the transfer.",
        advanced: "Coin<SUI> is passed by value into transfer_sui(). coin::split() destructures it into two Coin objects. transfer::public_transfer() updates the ownership field of the payment coin to Bob's address. Alice's remainder coin is returned to tx_context::sender(). All mutations are atomic.",
      },
      edgeLabel: "5 SUI",
    },
  },

  nft: {
    id: "nft", label: "Mint NFT", icon: "◈", color: "#F59E0B",
    code: `module suimulate::nft {
  use std::string::{Self, String};
  use sui::object::{Self, UID};
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};

  struct ArtNFT has key, store {
    id: UID,
    name: String,
    edition: u64,
    creator: address,
  }

  public entry fun mint_nft(
    ctx: &mut TxContext
  ) {
    // Contract creates the NFT object
    let nft = ArtNFT {
      id: object::new(ctx),
      name: std::string::utf8(b"Genesis #1"),
      edition: 1,
      creator: tx_context::sender(ctx),
    };

    // Contract transfers NFT to Alice (minter)
    transfer::public_transfer(nft, tx_context::sender(ctx));
  }
}`,
    simulation: {
      layout: "mint",
      initialState: {
        wallets: { Alice: { sui: 10, color: "#A78BFA" } },
        contract: { label: "MintContract", color: "#F59E0B" },
        objects: [],
      },
      steps: [
        { id: 1, action: "call_function",  label: "Mint Requested",      description: "Alice calls mint_nft() on the contract",                icon: "⚡",  detail: "Alice initiates the mint. The transaction context (ctx) carries her address and a unique tx hash used for object ID derivation." },
        { id: 2, action: "create_uid",     label: "UID Generated",        description: "object::new(ctx) creates a globally unique object ID",  icon: "🔑",  detail: "The UID is derived deterministically from the tx hash + counter. No two objects on Sui can share an ID." },
        { id: 3, action: "construct",      label: "NFT Constructed",      description: "ArtNFT struct assembled inside the contract",            icon: "🏗️", detail: "Fields populated: name='Genesis #1', edition=1, creator=Alice's address. The 'key' ability makes it a top-level owned object." },
        { id: 4, action: "transfer",       label: "NFT Sent to Alice",    description: "Contract transfers ArtNFT → Alice",                     icon: "→",   detail: "transfer::public_transfer() sets ownership to tx_context::sender() — Alice's address. The NFT leaves the contract context." },
        { id: 5, action: "commit",         label: "NFT Exists On-Chain",  description: "ArtNFT committed to Sui object store. Alice owns it.",  icon: "✓",   detail: "The object is permanently stored. It has its own ID, can be queried by anyone, and transferred again by Alice later." },
      ],
      finalState: {
        wallets: { Alice: { sui: 9.5, color: "#A78BFA" } },
        contract: { label: "MintContract", color: "#F59E0B" },
        objects: [{ name: "ArtNFT", subtitle: "Genesis #1 · Edition 1", owner: "Alice", color: "#F59E0B", icon: "◈", id: "0xAB12...F4E1" }],
      },
      explanation: {
        beginner: "Alice asked the smart contract to mint an NFT. The contract created 'Genesis #1', then handed it directly to Alice. It now lives on the blockchain as a unique object only Alice can transfer or sell.",
        advanced: "mint_nft() constructs an ArtNFT with the 'key' ability, enabling top-level Sui object ownership. object::new(ctx) derives a UID from the tx hash. The 'store' ability grants transferability. transfer::public_transfer() assigns ownership to ctx.sender (Alice). Gas deducted (~0.5 SUI).",
      },
      edgeLabel: "Mint",
    },
  },

  counter: {
    id: "counter", label: "Counter", icon: "⊕", color: "#10B981",
    code: `module suimulate::counter {
  use sui::object::{Self, UID};
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};

  // Owned counter — only Alice can increment
  struct Counter has key {
    id: UID,
    value: u64,
  }

  public entry fun create_counter(ctx: &mut TxContext) {
    let counter = Counter {
      id: object::new(ctx),
      value: 0,
    };
    // Transfer to Alice (sender) — NOT shared
    transfer::transfer(counter, tx_context::sender(ctx));
  }

  public entry fun increment(
    counter: &mut Counter,
    _ctx: &mut TxContext
  ) {
    counter.value = counter.value + 1;
  }

  public fun value(counter: &Counter): u64 {
    counter.value
  }
}`,
    simulation: {
      layout: "counter",
      initialState: {
        wallets: { Alice: { sui: 10, color: "#A78BFA" } },
        objects: [{ name: "Counter", subtitle: "value: 0", owner: "Alice", color: "#10B981", icon: "⊕", id: "0xCC44...8B2D", counterValue: 0 }],
      },
      steps: [
        { id: 1, action: "create_counter", label: "Counter Created",      description: "Alice calls create_counter() — owned by Alice only",   icon: "⚡",  detail: "Counter object created with value=0. transfer::transfer() (not share_object) means only Alice can call increment()." },
        { id: 2, action: "increment",      label: "Increment #1",         description: "Alice calls increment() → value: 0 → 1",               icon: "⊕",  detail: "counter.value = counter.value + 1. Because this is an owned object, no consensus ordering needed — instant finality." },
        { id: 3, action: "increment",      label: "Increment #2",         description: "Alice calls increment() → value: 1 → 2",               icon: "⊕",  detail: "Second increment. Owned object transactions on Sui bypass the consensus layer entirely, making them extremely fast." },
        { id: 4, action: "increment",      label: "Increment #3",         description: "Alice calls increment() → value: 2 → 3",               icon: "⊕",  detail: "Third increment. Only Alice (the owner) can call this — any other address would be rejected by the Move VM." },
        { id: 5, action: "commit",         label: "Final value: 3",       description: "Counter object reflects all mutations",                 icon: "✓",   detail: "The counter object is updated in Alice's possession. value=3. Unlike shared counters, this required zero cross-validator coordination." },
      ],
      finalState: {
        wallets: { Alice: { sui: 9.8, color: "#A78BFA" } },
        objects: [{ name: "Counter", subtitle: "value: 3", owner: "Alice", color: "#10B981", icon: "⊕", id: "0xCC44...8B2D", counterValue: 3 }],
      },
      explanation: {
        beginner: "Alice created a personal counter that only she can increment. She clicked '+' three times and the counter went from 0 to 3. Because she owns it, no one else can change it — it's like a private tally only she controls.",
        advanced: "Counter uses transfer::transfer() making it an owned object (not shared). Owned object transactions bypass Sui's consensus layer (Narwhal/Bullshark), achieving single-round-trip finality. The &mut Counter argument requires the caller to own the object — the Move VM enforces this at the bytecode level.",
      },
      edgeLabel: "+3",
    },
  },

  marketplace: {
    id: "marketplace", label: "Marketplace", icon: "⬡", color: "#EC4899",
    code: `module suimulate::marketplace {
  use sui::object::{Self, UID};
  use sui::coin::{Self, Coin};
  use sui::sui::SUI;
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};

  struct PixelSword has key, store {
    id: UID,
    name: String,
    power: u64,
  }

  struct Marketplace has key {
    id: UID,
    volume: u64,
  }

  // Bob calls this to buy Alice's NFT
  public entry fun purchase(
    marketplace: &mut Marketplace,
    nft: PixelSword,
    mut payment: Coin<SUI>,
    ctx: &mut TxContext
  ) {
    let price: u64 = 3;
    assert!(coin::value(&payment) >= price, 0);

    // Split exact price and pay Alice
    let exact = coin::split(&mut payment, price, ctx);
    transfer::public_transfer(exact, @alice);

    // Send NFT to Bob
    transfer::public_transfer(nft, tx_context::sender(ctx));

    // Return change to Bob
    transfer::public_transfer(payment, tx_context::sender(ctx));

    marketplace.volume = marketplace.volume + price;
  }
}`,
    simulation: {
      layout: "marketplace",
      initialState: {
        wallets: { Alice: { sui: 10, color: "#A78BFA" }, Bob: { sui: 6, color: "#34D399" } },
        contract: { label: "Marketplace", color: "#EC4899" },
        objects: [{ name: "Pixel Sword", subtitle: "Owned by Alice · 3 SUI", owner: "Alice", color: "#EC4899", icon: "⬡", id: "0xDD55...7A3C" }],
      },
      steps: [
        { id: 1, action: "call_function",  label: "Purchase Initiated",   description: "Bob calls purchase() with 6 SUI payment",              icon: "⚡",  detail: "Bob initiates the purchase. The shared Marketplace object, the PixelSword NFT, and Bob's Coin<SUI> are all inputs to this transaction." },
        { id: 2, action: "access_object",  label: "NFT Verified",         description: "PixelSword loaded — currently owned by Alice",          icon: "🔍",  detail: "The NFT object is read into the transaction. Its current owner (Alice) is noted. The Marketplace volume counter is also loaded." },
        { id: 3, action: "validate",       label: "Payment Validated",    description: "assert!(coin::value >= 3) passes ✓",                    icon: "✓",   detail: "Bob's coin is checked: value=6 >= price=3. If insufficient, transaction aborts with error code 0. No partial state changes." },
        { id: 4, action: "split_pay",      label: "Payment Split & Sent", description: "3 SUI split from Bob's coin → sent to Alice",           icon: "💸",  detail: "coin::split() carves out exactly 3 SUI. transfer::public_transfer() routes it to Alice's address. Remaining 3 SUI returned to Bob." },
        { id: 5, action: "transfer_nft",   label: "NFT Transferred",      description: "PixelSword ownership updated Alice → Bob",              icon: "→",   detail: "transfer::public_transfer() updates the NFT's ownership field to Bob (tx_context::sender()). Marketplace volume incremented by 3." },
        { id: 6, action: "commit",         label: "Trade Complete",        description: "Atomic swap complete. All objects committed.",          icon: "✓",   detail: "Every mutation committed atomically. Bob has the NFT, Alice has the SUI, marketplace volume updated. Zero trust required." },
      ],
      finalState: {
        wallets: { Alice: { sui: 13, color: "#A78BFA" }, Bob: { sui: 3, color: "#34D399" } },
        contract: { label: "Marketplace", color: "#EC4899" },
        objects: [{ name: "Pixel Sword", subtitle: "Owned by Bob · Paid 3 SUI", owner: "Bob", color: "#EC4899", icon: "⬡", id: "0xDD55...7A3C" }],
      },
      explanation: {
        beginner: "Bob bought Alice's Pixel Sword NFT for 3 SUI through the marketplace. The smart contract handled the swap automatically — Alice received 3 SUI, Bob received the NFT. No trust needed, no middleman.",
        advanced: "PixelSword is passed by value into purchase(), consuming it (prevents double-spend). coin::split() extracts exactly price=3 SUI. transfer::public_transfer() routes payment to Alice and NFT to tx_context::sender() (Bob). The Marketplace shared object volume is incremented. Entire transaction is atomic.",
      },
      edgeLabel: "3 SUI",
    },
  },
};

// ─── KNOWN FUNCTIONS (for custom code detection) ─────────────────────────────
const KNOWN_FUNCTIONS = {
  transfer: ["transfer_sui"],
  nft: ["mint_nft"],
  counter: ["create_counter", "increment", "value"],
  marketplace: ["purchase"],
};

// ─── GEMINI AI SIMULATOR ─────────────────────────────────────────────────────

async function simulateWithGemini(code, apiKey) {
  const prompt = `You are a Move language simulator for the Sui blockchain.
A developer wrote this Move code:

\`\`\`move
${code}
\`\`\`

Return ONLY a valid JSON object (no markdown, no backticks) with this structure:
{
  "initialState": { "wallets": { "Alice": { "sui": 10, "color": "#A78BFA" }, "Bob": { "sui": 2, "color": "#34D399" } }, "objects": [] },
  "steps": [ { "id": 1, "action": "call_function", "label": "Short label", "description": "One sentence.", "icon": "⚡", "detail": "Technical detail." } ],
  "finalState": { "wallets": { "Alice": { "sui": 8, "color": "#A78BFA" }, "Bob": { "sui": 4, "color": "#34D399" } }, "objects": [] },
  "explanation": { "beginner": "Plain English.", "advanced": "Technical Move explanation." },
  "edgeLabel": "2 SUI"
}
Rules: 4-6 steps, single emoji icons, realistic SUI values, objects need name/subtitle/owner/color/icon/id fields.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 8192 } }) }
  );
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Gemini error (${res.status})`); }
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
const jsonMatch = raw.match(/\{[\s\S]*\}/);
if (!jsonMatch) throw new Error("Gemini returned no valid JSON. Try again.");
return JSON.parse(jsonMatch[0]);

}

// ─── REGEX PARSER ────────────────────────────────────────────────────────────

function parseCodeParams(code, templateId) {
  const errors = [], params = {};

  if (templateId === "transfer") {
    // Match: let amount: u64 = 5;  OR  let amount = 5;
    const amtMatch = code.match(/let\s+amount\s*(?::\s*u64\s*)?=\s*(\d+)/);
    params.amount = amtMatch ? parseInt(amtMatch[1]) : 5;
    if (!amtMatch) errors.push({ type: "warn", msg: "Could not find 'let amount = N' — using default of 5 SUI." });
    else if (params.amount <= 0) errors.push({ type: "error", msg: "Amount must be greater than 0." });
    else if (params.amount > 10) errors.push({ type: "error", msg: `Insufficient balance: Alice only has 10 SUI, can't send ${params.amount}.` });
    else if (params.amount === 10) errors.push({ type: "warn", msg: "Sending entire balance — Alice will have 0 SUI left." });

  } else if (templateId === "nft") {
    const edMatch = code.match(/edition\s*:\s*(\d+)/);
    params.edition = edMatch ? parseInt(edMatch[1]) : 1;
    const nameMatch = code.match(/b"([^"]+)"/);
    params.nftName = nameMatch ? nameMatch[1] : "Genesis #1";

  } else if (templateId === "counter") {
    const incMatches = code.match(/increment\s*\(/g);
    params.increments = incMatches ? incMatches.length : 3;
    if (params.increments > 10) errors.push({ type: "warn", msg: "Capping visualization at 10 increments." });

  } else if (templateId === "marketplace") {
    const priceMatch = code.match(/let\s+price\s*(?::\s*u64\s*)?=\s*(\d+)/);
    params.price = priceMatch ? parseInt(priceMatch[1]) : 3;
    if (params.price > 6) errors.push({ type: "error", msg: `Price ${params.price} SUI exceeds Bob's balance of 6 SUI.` });
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
        s.action === "split" ? { ...s, description: `coin::split() carves out a new Coin<SUI> of ${amount} SUI` }
        : s.action === "transfer" ? { ...s, description: `${amount} SUI moves from Alice → Bob` }
        : s.action === "call_function" ? { ...s, description: `transfer_sui() invoked — amount=${amount}` }
        : s
      ),
      finalState: { wallets: { Alice: { sui: aliceAfter, color: "#A78BFA" }, Bob: { sui: bobAfter, color: "#34D399" } }, objects: [] },
      edgeLabel: `${amount} SUI`,
      explanation: {
        beginner: `Alice sent ${amount} SUI to Bob. Alice now has ${aliceAfter} SUI, Bob has ${bobAfter} SUI. The blockchain verified the balance before allowing the send.`,
        advanced: `coin::split() creates a child Coin<SUI> of value=${amount}. transfer::public_transfer() sets its ownership to Bob. Alice's remainder (${aliceAfter} SUI) returned to sender. Atomic execution.`,
      },
    };
  }

  if (templateId === "nft") {
    const { edition = 1, nftName = "Genesis #1" } = params;
    return {
      ...base,
      steps: base.steps.map((s) =>
        s.action === "construct" ? { ...s, description: `ArtNFT { name: "${nftName}", edition: ${edition} } assembled` }
        : s.action === "call_function" ? { ...s, description: `Alice calls mint_nft() — minting "${nftName}" #${edition}` }
        : s
      ),
      finalState: { ...base.finalState, objects: [{ name: "ArtNFT", subtitle: `${nftName} · Edition ${edition}`, owner: "Alice", color: "#F59E0B", icon: "◈", id: "0xAB12...F4E1" }] },
      edgeLabel: "Mint",
      explanation: {
        beginner: `Alice minted "${nftName}" (edition #${edition}). The contract created it and handed it straight to Alice. It now lives on-chain as a unique object.`,
        advanced: `ArtNFT constructed with name="${nftName}", edition=${edition}. object::new(ctx) derives a UID. 'key' + 'store' abilities enable ownership and transferability. transfer::public_transfer() to ctx.sender.`,
      },
    };
  }

  if (templateId === "counter") {
    const capped = Math.min(params.increments || 3, 10);
    const steps = [
      { id: 1, action: "create_counter", label: "Counter Created", description: "Alice calls create_counter() — owned by Alice only", icon: "⚡", detail: "Counter object created with value=0. transfer::transfer() (not share_object) means only Alice can increment." },
      ...Array.from({ length: capped }, (_, i) => ({
        id: i + 2, action: "increment", label: `Increment #${i + 1}`,
        description: `Alice calls increment() → value: ${i} → ${i + 1}`,
        icon: "⊕", detail: `counter.value = counter.value + 1. Owned object — no consensus needed. Fast finality.`,
      })),
      { id: capped + 2, action: "commit", label: `Final value: ${capped}`, description: `Counter reflects all ${capped} mutations`, icon: "✓", detail: `value=${capped}. Only Alice (the owner) could have made these increments.` },
    ];
    return {
      ...base,
      steps,
      finalState: {
        wallets: { Alice: { sui: parseFloat((10 - capped * 0.06).toFixed(2)), color: "#A78BFA" } },
        objects: [{ name: "Counter", subtitle: `value: ${capped}`, owner: "Alice", color: "#10B981", icon: "⊕", id: "0xCC44...8B2D", counterValue: capped }],
      },
      edgeLabel: `+${capped}`,
      explanation: {
        beginner: `Alice created a personal counter and incremented it ${capped} times (0 → ${capped}). Only she can change it — it's a private owned object.`,
        advanced: `Owned Counter bypasses Sui consensus. Each increment() call is a single-round-trip transaction. Only Alice (the owner) can pass &mut Counter — Move VM enforces this at bytecode level. Final value: ${capped}.`,
      },
    };
  }

  if (templateId === "marketplace") {
    const { price = 3 } = params;
    const aliceAfter = parseFloat((10 + price).toFixed(2));
    const bobAfter = parseFloat((6 - price).toFixed(2));
    return {
      ...base,
      steps: base.steps.map((s) =>
        s.action === "validate" ? { ...s, description: `assert!(coin::value >= ${price}) passes ✓` }
        : s.action === "split_pay" ? { ...s, description: `${price} SUI split from Bob's coin → sent to Alice` }
        : s
      ),
      finalState: {
        wallets: { Alice: { sui: aliceAfter, color: "#A78BFA" }, Bob: { sui: bobAfter, color: "#34D399" } },
        contract: base.finalState.contract,
        objects: [{ name: "Pixel Sword", subtitle: `Owned by Bob · Paid ${price} SUI`, owner: "Bob", color: "#EC4899", icon: "⬡", id: "0xDD55...7A3C" }],
      },
      edgeLabel: `${price} SUI`,
      explanation: {
        beginner: `Bob bought Alice's Pixel Sword for ${price} SUI. Alice now has ${aliceAfter} SUI, Bob has ${bobAfter} SUI and the NFT. The contract handled the swap — trustless, no middleman.`,
        advanced: `PixelSword consumed by value (prevents double-spend). coin::split() extracts price=${price}. transfer::public_transfer() routes payment to Alice, NFT to Bob. Marketplace volume += ${price}. Atomic.`,
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
  const keywords = ["module","use","struct","public","entry","fun","let","if","else","return","has","key","store","copy","drop","mut","Self","assert","u64","u8","u128","bool","address","vector"];
  const types = ["String","Coin","SUI","UID","TxContext","Counter","ArtNFT","PixelSword","Marketplace"];
  const builtins = ["transfer","coin","object","tx_context","string"];
  let r = code.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  r = r.replace(/(\/\/[^\n]*)/g,'<span style="color:#6B7280;font-style:italic">$1</span>');
  r = r.replace(/(b?"(?:[^"\\]|\\.)*")/g,'<span style="color:#FCD34D">$1</span>');
  r = r.replace(/\b(\d+)\b/g,'<span style="color:#F9A8D4">$1</span>');
  keywords.forEach((kw) => { r = r.replace(new RegExp(`\\b(${kw})\\b`,"g"),'<span style="color:#818CF8;font-weight:600">$1</span>'); });
  types.forEach((t) => { r = r.replace(new RegExp(`\\b(${t})\\b`,"g"),'<span style="color:#34D399">$1</span>'); });
  builtins.forEach((b) => { r = r.replace(new RegExp(`\\b(${b})\\b`,"g"),'<span style="color:#60A5FA">$1</span>'); });
  return r;
}

// ─── GEMINI KEY PANEL ────────────────────────────────────────────────────────

function GeminiKeyPanel({ geminiKey, onSave, onClose }) {
  const [input, setInput] = useState(geminiKey);
  const save = () => { try { localStorage.setItem("gemini_key", input); } catch (_) {} onSave(input); onClose(); };
  const clear = () => { try { localStorage.removeItem("gemini_key"); } catch (_) {} onSave(""); setInput(""); };
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(7,13,26,0.88)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center" }}
      onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div className="gemini-key-panel" style={{ background:"#0F172A",border:"1px solid #1E293B",borderRadius:"16px",padding:"28px",width:"420px",maxWidth:"90%",display:"flex",flexDirection:"column",gap:"16px",boxShadow:"0 24px 64px rgba(0,0,0,0.6)",animation:"fadeIn 0.2s ease" }}>
        <div>
          <div style={{ fontWeight:800,fontSize:"16px",color:"#F1F5F9",marginBottom:"6px" }}>✦ Enable AI Simulation</div>
          <div style={{ color:"#64748B",fontSize:"12px",lineHeight:1.6 }}>Add your free Gemini Flash 2.5 key to simulate <strong style={{color:"#94A3B8"}}>any</strong> custom Move function — not just built-in templates.</div>
        </div>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:"8px",background:"rgba(99,102,241,0.1)",border:"1px solid #6366F140",color:"#818CF8",fontSize:"12px",fontWeight:600,textDecoration:"none" }}>
          <span>🔑 Get a free key at Google AI Studio</span><span style={{opacity:0.6}}>→</span>
        </a>
        <div style={{ display:"flex",flexDirection:"column",gap:"6px" }}>
          <label style={{ color:"#475569",fontSize:"10px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" }}>Your Gemini API Key</label>
          <input type="password" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&input.trim()&&save()} placeholder="AIza..."
            style={{ background:"#070D1A",border:"1px solid #1E293B",borderRadius:"8px",padding:"10px 12px",color:"#E2E8F0",fontSize:"12px",fontFamily:"'JetBrains Mono',monospace",outline:"none",width:"100%" }} />
          <div style={{ color:"#475569",fontSize:"10px",lineHeight:1.5 }}>🔒 Browser-only. Sent directly to Google's API — never to any other server.</div>
        </div>
        <div style={{ display:"flex",gap:"8px" }}>
          <button onClick={save} disabled={!input.trim()} style={{ flex:1,padding:"10px",background:input.trim()?"#6366F1":"#1E293B",color:input.trim()?"#fff":"#475569",border:"none",borderRadius:"8px",fontWeight:700,fontSize:"12px",cursor:input.trim()?"pointer":"not-allowed" }}>Save Key</button>
          {geminiKey && <button onClick={clear} style={{ padding:"10px 14px",background:"transparent",color:"#F87171",border:"1px solid #F8717140",borderRadius:"8px",fontSize:"12px",cursor:"pointer" }}>Clear</button>}
          <button onClick={onClose} style={{ padding:"10px 14px",background:"transparent",color:"#64748B",border:"1px solid #1E293B",borderRadius:"8px",fontSize:"12px",cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── VISUALIZATION LAYOUTS ───────────────────────────────────────────────────

function VisualizationCanvas({ template, sim, currentStep, isComplete }) {
  const layout = sim.layout || template.simulation.layout;
  if (layout === "mint") return <MintLayout template={template} sim={sim} currentStep={currentStep} isComplete={isComplete} />;
  if (layout === "counter") return <CounterLayout template={template} sim={sim} currentStep={currentStep} isComplete={isComplete} />;
  if (layout === "marketplace") return <MarketplaceLayout template={template} sim={sim} currentStep={currentStep} isComplete={isComplete} />;
  return <TransferLayout template={template} sim={sim} currentStep={currentStep} isComplete={isComplete} />;
}

// shared canvas wrapper
function CanvasWrap({ template, children, activeStep }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
  return (
    <div className="viz-container" style={{ position:"relative",width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"20px",transform:isMobile?"scale(0.8)":"scale(1)",transformOrigin:"center" }}>
      <div style={{ position:"absolute",inset:0,backgroundImage:"radial-gradient(circle, #1E293B 1px, transparent 1px)",backgroundSize:"28px 28px",opacity:0.35 }} />
      <div style={{ position:"absolute",width:"300px",height:"300px",borderRadius:"50%",background:`radial-gradient(circle, ${template.color}15 0%, transparent 70%)`,top:"50%",left:"50%",transform:"translate(-50%, -50%)" }} />
      {children}
      {activeStep && (
        <div style={{ position:"relative",zIndex:2,background:"rgba(15,23,42,0.92)",border:`1px solid ${template.color}40`,borderRadius:"12px",padding:"10px 16px",display:"flex",alignItems:"center",gap:"10px",animation:"fadeIn 0.3s ease",maxWidth:"400px",textAlign:"center" }}>
          <span style={{ fontSize:"20px",flexShrink:0 }}>{activeStep.icon}</span>
          <div>
            <div style={{ color:template.color,fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" }}>{activeStep.label}</div>
            <div style={{ color:"#94A3B8",fontSize:"12px",marginTop:"2px" }}>{activeStep.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Transfer Layout ──

function TransferLayout({ template, sim, currentStep, isComplete }) {
  const activeStep = sim.steps[currentStep - 1];
  const showEdge = currentStep >= 4 || isComplete;
  const edgeProgress = isComplete ? 1 : currentStep >= 4 ? (currentStep - 3) / 2 : 0;
  const state = (isComplete || currentStep >= sim.steps.length) ? sim.finalState : sim.initialState;
  const orig = sim.initialState;
  return (
    <CanvasWrap template={template} activeStep={activeStep}>
      <div style={{ position:"relative",zIndex:2,display:"flex",alignItems:"center",gap:"0" }}>
        <WalletNode name="Alice" data={state.wallets.Alice} orig={orig.wallets.Alice} highlighted={activeStep && (activeStep.action==="split"||activeStep.action==="transfer")} currentStep={currentStep} isComplete={isComplete} />
        <FlowEdge visible={showEdge} progress={edgeProgress} color={template.color} label={sim.edgeLabel} isComplete={isComplete} />
        <WalletNode name="Bob" data={state.wallets.Bob} orig={orig.wallets.Bob} highlighted={activeStep && activeStep.action==="transfer"} currentStep={currentStep} isComplete={isComplete} />
      </div>
      {isComplete && <CompleteBadge />}
    </CanvasWrap>
  );
}

// ── Mint Layout ──

function MintLayout({ template, sim, currentStep, isComplete }) {
  const activeStep = sim.steps[currentStep - 1];
  const state = (isComplete || currentStep >= sim.steps.length) ? sim.finalState : sim.initialState;
  const orig = sim.initialState;
  const showRequestEdge = currentStep >= 1;
  const showNFTEdge = currentStep >= 4 || isComplete;
  const nftObj = state.objects[0];
  const requestProgress = isComplete ? 1 : Math.min(currentStep / 3, 1);
  const nftProgress = isComplete ? 1 : currentStep >= 4 ? (currentStep - 3) / 2 : 0;

  return (
    <CanvasWrap template={template} activeStep={activeStep}>
      {/* NFT object at top */}
      <div style={{ position:"relative",zIndex:2,display:"flex",justifyContent:"center" }}>
        <ObjectNode obj={nftObj || { name:"ArtNFT",subtitle:"pending...",owner:"Contract",color:"#F59E0B",icon:"◈",id:"0x..." }} visible={true} dimmed={!isComplete && currentStep < 3} />
      </div>

      {/* Alice ←→ Contract */}
      <div style={{ position:"relative",zIndex:2,display:"flex",alignItems:"center",gap:0 }}>
        <WalletNode name="Alice" data={state.wallets.Alice} orig={orig.wallets.Alice} highlighted={activeStep && (activeStep.action==="call_function"||activeStep.action==="transfer")} currentStep={currentStep} isComplete={isComplete} />
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",width:"140px",gap:"4px" }}>
          {/* mint request arrow: Alice → Contract */}
          <MiniArrow visible={showRequestEdge} progress={requestProgress} color="#818CF8" label="mint request" leftToRight={true} />
          {/* NFT return arrow: Contract → Alice */}
          <MiniArrow visible={showNFTEdge} progress={nftProgress} color={template.color} label="ArtNFT" leftToRight={false} />
        </div>
        <ContractNode label="MintContract" color={template.color} active={activeStep && (activeStep.action==="create_uid"||activeStep.action==="construct")} />
      </div>

      {isComplete && <CompleteBadge />}
    </CanvasWrap>
  );
}

// ── Counter Layout ──

function CounterLayout({ template, sim, currentStep, isComplete }) {
  const activeStep = sim.steps[currentStep - 1];
  const state = (isComplete || currentStep >= sim.steps.length) ? sim.finalState : sim.initialState;
  const orig = sim.initialState;

  // Compute live counter value based on current step
  const incrementSteps = sim.steps.filter(s => s.action === "increment");
  const incrementsDone = sim.steps.slice(0, currentStep).filter(s => s.action === "increment").length;
  const liveValue = incrementsDone;

  const counterObj = {
    ...(state.objects[0] || sim.initialState.objects[0]),
    subtitle: `value: ${liveValue}`,
    counterValue: liveValue,
  };

  return (
    <CanvasWrap template={template} activeStep={activeStep}>
      {/* Counter card at top — always visible */}
      <div style={{ position:"relative",zIndex:2 }}>
        <CounterCard obj={counterObj} color={template.color} active={activeStep && activeStep.action==="increment"} created={currentStep >= 1} />
      </div>

      {/* Alice wallet below */}
      <div style={{ position:"relative",zIndex:2 }}>
        <WalletNode name="Alice" data={state.wallets.Alice} orig={orig.wallets.Alice} highlighted={activeStep && activeStep.action==="increment"} currentStep={currentStep} isComplete={isComplete} />
      </div>

      {/* Increment arrow from Alice up to Counter */}
      {currentStep >= 2 && (
        <div style={{ position:"absolute",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",opacity: activeStep&&activeStep.action==="increment"?1:0.3,transition:"opacity 0.4s ease" }}>
          <div style={{ color:template.color,fontSize:"11px",fontWeight:700,letterSpacing:"0.05em" }}>increment()</div>
        </div>
      )}

      {isComplete && <CompleteBadge />}
    </CanvasWrap>
  );
}

// ── Marketplace Layout ──

function MarketplaceLayout({ template, sim, currentStep, isComplete }) {
  const activeStep = sim.steps[currentStep - 1];
  const state = (isComplete || currentStep >= sim.steps.length) ? sim.finalState : sim.initialState;
  const orig = sim.initialState;

  const nftInitial = sim.initialState.objects[0];
  const nftFinal = sim.finalState.objects[0];
  const nftObj = (isComplete || currentStep >= 5) ? nftFinal : nftInitial;

  const showPayEdge = currentStep >= 4 || isComplete;
  const showNFTEdge = currentStep >= 5 || isComplete;
  const payProgress = isComplete ? 1 : currentStep >= 4 ? (currentStep - 3) : 0;
  const nftProgress = isComplete ? 1 : currentStep >= 5 ? (currentStep - 4) : 0;

  return (
    <CanvasWrap template={template} activeStep={activeStep}>
      {/* NFT at top — visible from start, owned by Alice, then Bob */}
      <div style={{ position:"relative",zIndex:2 }}>
        <ObjectNode obj={nftObj} visible={true} />
      </div>

      {/* Alice ←→ Marketplace ←→ Bob */}
      <div style={{ position:"relative",zIndex:2,display:"flex",alignItems:"center",gap:0 }}>
        <WalletNode name="Alice" data={state.wallets.Alice} orig={orig.wallets.Alice} highlighted={activeStep&&(activeStep.action==="split_pay")} currentStep={currentStep} isComplete={isComplete} />
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",width:"110px",gap:"4px" }}>
          <MiniArrow visible={showPayEdge} progress={payProgress} color="#34D399" label="3 SUI" leftToRight={false} />
        </div>
        <ContractNode label="Marketplace" color={template.color} active={activeStep&&(activeStep.action==="validate"||activeStep.action==="split_pay"||activeStep.action==="transfer_nft")} />
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",width:"110px",gap:"4px" }}>
          <MiniArrow visible={currentStep>=1} progress={isComplete?1:Math.min(currentStep/2,1)} color="#818CF8" label="payment" leftToRight={false} />
          <MiniArrow visible={showNFTEdge} progress={nftProgress} color={template.color} label="NFT" leftToRight={true} />
        </div>
        <WalletNode name="Bob" data={state.wallets.Bob} orig={orig.wallets.Bob} highlighted={activeStep&&(activeStep.action==="transfer_nft")} currentStep={currentStep} isComplete={isComplete} />
      </div>

      {isComplete && <CompleteBadge />}
    </CanvasWrap>
  );
}

// ─── SHARED VISUAL ATOMS ─────────────────────────────────────────────────────

function WalletNode({ name, data, orig, highlighted, currentStep, isComplete }) {
  const showUpdated = isComplete || currentStep >= 4;
  const changed = showUpdated && orig && parseFloat(data.sui) !== parseFloat(orig.sui);
  const diff = orig ? parseFloat((data.sui - orig.sui).toFixed(2)) : 0;
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"8px" }}>
      <div style={{ width:"68px",height:"68px",borderRadius:"50%",background:`radial-gradient(135deg, ${data.color}30, ${data.color}10)`,border:`2px solid ${highlighted?data.color:data.color+"50"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",boxShadow:highlighted?`0 0 24px ${data.color}70`:"none",transition:"all 0.4s ease",animation:highlighted?"pulseWallet 1s ease infinite":"none" }}>
        {name==="Alice"?"👩":"👨"}
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ color:"#E2E8F0",fontSize:"12px",fontWeight:700 }}>{name}</div>
        <div style={{ color:changed?(diff>0?"#34D399":"#F87171"):"#64748B",fontSize:"11px",marginTop:"2px",fontFamily:"'JetBrains Mono',monospace",transition:"color 0.5s ease" }}>
          {showUpdated?data.sui:(orig?orig.sui:data.sui)} SUI
          {changed&&<span style={{ marginLeft:"4px",fontSize:"9px" }}>{diff>0?`+${diff}`:diff}</span>}
        </div>
      </div>
    </div>
  );
}

function ContractNode({ label, color, active }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"8px" }}>
      <div style={{ width:"64px",height:"64px",borderRadius:"14px",background:`linear-gradient(135deg, ${color}25, ${color}10)`,border:`2px solid ${active?color:color+"40"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",boxShadow:active?`0 0 20px ${color}60`:"none",transition:"all 0.4s ease" }}>
        📜
      </div>
      <div style={{ color:"#64748B",fontSize:"10px",fontWeight:600,textAlign:"center",maxWidth:"70px" }}>{label}</div>
    </div>
  );
}

function ObjectNode({ obj, visible, dimmed }) {
  if (!obj) return null;
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",opacity:dimmed?0.3:visible?1:0,transform:visible?"translateY(0) scale(1)":"translateY(-12px) scale(0.85)",transition:"all 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div style={{ width:"58px",height:"58px",borderRadius:"12px",background:`linear-gradient(135deg, ${obj.color}25, ${obj.color}10)`,border:`1.5px solid ${obj.color}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",boxShadow:`0 0 18px ${obj.color}30` }}>
        {obj.icon}
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ color:"#E2E8F0",fontSize:"11px",fontWeight:700 }}>{obj.name}</div>
        <div style={{ color:"#64748B",fontSize:"9px" }}>{obj.subtitle}</div>
        <div style={{ color:obj.color,fontSize:"9px",opacity:0.9,marginTop:"1px" }}>→ {obj.owner}</div>
      </div>
    </div>
  );
}

function CounterCard({ obj, color, active, created }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",opacity:created?1:0.2,transition:"opacity 0.5s ease" }}>
      <div style={{ width:"90px",height:"90px",borderRadius:"18px",background:`linear-gradient(135deg, ${color}20, ${color}08)`,border:`2px solid ${active?color:color+"50"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"4px",boxShadow:active?`0 0 28px ${color}60`:`0 0 12px ${color}20`,transition:"all 0.4s ease" }}>
        <div style={{ color:color,fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",opacity:0.8 }}>Counter</div>
        <div style={{ color:"#F1F5F9",fontSize:"32px",fontWeight:900,fontFamily:"'JetBrains Mono',monospace",lineHeight:1,transition:"all 0.3s ease",transform:active?"scale(1.2)":"scale(1)" }}>
          {obj.counterValue}
        </div>
      </div>
      <div style={{ color:"#64748B",fontSize:"10px",fontWeight:600 }}>Owned by Alice</div>
    </div>
  );
}

function FlowEdge({ visible, progress, color, label, isComplete }) {
  return (
    <div style={{ position:"relative",width:"130px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      <div style={{ position:"absolute",left:0,right:0,height:"1px",background:`linear-gradient(90deg, ${color}20, ${color}70, ${color}20)`,opacity:visible?1:0,transition:"opacity 0.5s ease" }} />
      {visible && <div style={{ position:"absolute",left:`${progress*80}%`,width:"8px",height:"8px",borderRadius:"50%",background:color,boxShadow:`0 0 10px ${color}`,transition:"left 0.6s cubic-bezier(0.4,0,0.2,1)",opacity:isComplete?0:1 }} />}
      {visible && <div style={{ position:"absolute",top:"-17px",color,fontSize:"10px",fontWeight:700,background:"rgba(15,23,42,0.85)",padding:"1px 6px",borderRadius:"4px",border:`1px solid ${color}30`,whiteSpace:"nowrap" }}>{label}</div>}
      {isComplete && <div style={{ position:"absolute",right:"2px",color,fontSize:"14px",opacity:0.9 }}>›</div>}
    </div>
  );
}

function MiniArrow({ visible, progress, color, label, leftToRight }) {
  return (
    <div style={{ position:"relative",width:"100%",height:"18px",display:"flex",alignItems:"center",opacity:visible?1:0,transition:"opacity 0.4s ease" }}>
      <div style={{ position:"absolute",left:0,right:0,height:"1px",background:`linear-gradient(${leftToRight?"90deg":"270deg"}, ${color}20, ${color}70, ${color}20)` }} />
      {visible && <div style={{ position:"absolute",left:leftToRight?`${progress*80}%`:`${(1-progress)*80}%`,width:"6px",height:"6px",borderRadius:"50%",background:color,boxShadow:`0 0 8px ${color}`,transition:"left 0.5s ease" }} />}
      <div style={{ position:"absolute",top:"-14px",left:"50%",transform:"translateX(-50%)",color,fontSize:"9px",fontWeight:700,background:"rgba(15,23,42,0.85)",padding:"1px 5px",borderRadius:"3px",whiteSpace:"nowrap" }}>{label}</div>
      <div style={{ position:"absolute",right:leftToRight?"2px":"auto",left:leftToRight?"auto":"2px",color,fontSize:"12px",opacity:0.8 }}>{leftToRight?"›":"‹"}</div>
    </div>
  );
}

function CompleteBadge() {
  return (
    <div style={{ position:"relative",zIndex:2,background:"rgba(16,185,129,0.1)",border:"1px solid #10B98140",borderRadius:"10px",padding:"8px 18px",color:"#34D399",fontSize:"12px",fontWeight:700,animation:"fadeIn 0.4s ease" }}>
      ✓ Transaction Complete
    </div>
  );
}

// ─── TIMELINE ────────────────────────────────────────────────────────────────

function Timeline({ steps, currentStep, templateColor, onStepClick }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"3px" }}>
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const isDone = currentStep > step.id;
        return (
          <button key={step.id} onClick={() => onStepClick(step.id)} style={{ display:"flex",alignItems:"flex-start",gap:"10px",padding:"7px 10px",borderRadius:"8px",background:isActive?`${templateColor}15`:isDone?"rgba(30,41,59,0.4)":"transparent",border:`1px solid ${isActive?templateColor+"50":"transparent"}`,cursor:"pointer",textAlign:"left",transition:"all 0.25s ease",width:"100%" }}>
            <div style={{ width:"20px",height:"20px",borderRadius:"50%",background:isActive?templateColor:isDone?"#1E293B":"#0F172A",border:`1.5px solid ${isActive?templateColor:isDone?templateColor+"60":"#1E293B"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"8px",transition:"all 0.25s ease",boxShadow:isActive?`0 0 10px ${templateColor}60`:"none" }}>
              {isDone?<span style={{color:templateColor,fontSize:"9px"}}>✓</span>:<span style={{color:isActive?"#0F172A":"#475569",fontWeight:700}}>{step.id}</span>}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ color:isActive?"#E2E8F0":isDone?"#64748B":"#475569",fontSize:"11px",fontWeight:isActive?700:500,lineHeight:1.3 }}>{step.icon} {step.label}</div>
              {isActive && <div style={{ color:"#64748B",fontSize:"10px",marginTop:"3px",lineHeight:1.5,animation:"fadeIn 0.3s ease" }}>{step.detail}</div>}
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"10px" }}>
      <div className="state-panel-grid" style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"8px" }}>
        {["Before","After"].map((label) => {
          const sd = label==="Before" ? sim.initialState : sim.finalState;
          const isAfter = label==="After";
          return (
            <div key={label} style={{ background:"rgba(15,23,42,0.6)",border:`1px solid ${isAfter&&showAfter?template.color+"40":"#1E293B"}`,borderRadius:"10px",padding:"10px",opacity:isAfter&&!showAfter?0.3:1,transition:"all 0.5s ease" }}>
              <div style={{ color:isAfter&&showAfter?template.color:"#475569",fontSize:"9px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"8px" }}>{label}</div>
              {Object.entries(sd.wallets).map(([name,data]) => (
                <div key={name} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px" }}>
                  <span style={{ color:data.color,fontSize:"11px",fontWeight:600 }}>{name}</span>
                  <span style={{ color:"#94A3B8",fontSize:"11px",fontFamily:"'JetBrains Mono',monospace" }}>{data.sui} SUI</span>
                </div>
              ))}
              {sd.objects.map((obj,i) => (
                <div key={i} style={{ marginTop:"6px",padding:"5px 7px",background:`${obj.color}10`,border:`1px solid ${obj.color}30`,borderRadius:"6px" }}>
                  <div style={{ color:obj.color,fontSize:"10px",fontWeight:700 }}>{obj.icon} {obj.name}</div>
                  <div style={{ color:"#64748B",fontSize:"9px" }}>→ {obj.owner}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {showAfter && (
        <div style={{ background:"rgba(16,185,129,0.05)",border:"1px solid #10B98120",borderRadius:"8px",padding:"8px 10px",animation:"fadeIn 0.5s ease" }}>
          <div style={{ color:"#34D399",fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"6px" }}>Changes</div>
          {Object.entries(sim.finalState.wallets).map(([name,data]) => {
            const orig = sim.initialState.wallets[name];
            if (!orig) return null;
            const diff = parseFloat((data.sui - orig.sui).toFixed(2));
            if (diff===0) return null;
            return (
              <div key={name} style={{ display:"flex",justifyContent:"space-between",marginBottom:"3px" }}>
                <span style={{ color:"#94A3B8",fontSize:"11px" }}>{name}</span>
                <span style={{ color:diff>0?"#34D399":"#F87171",fontSize:"11px",fontWeight:600,fontFamily:"'JetBrains Mono',monospace" }}>{diff>0?"+":""}{diff} SUI</span>
              </div>
            );
          })}
          {sim.finalState.objects.map((obj,i) => (
            <div key={i} style={{ display:"flex",justifyContent:"space-between",marginTop:"3px" }}>
              <span style={{ color:"#94A3B8",fontSize:"11px" }}>{obj.name}</span>
              <span style={{ color:template.color,fontSize:"11px" }}>→ {obj.owner}</span>
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
    <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
      <div style={{ display:"flex",background:"rgba(15,23,42,0.8)",border:"1px solid #1E293B",borderRadius:"8px",padding:"3px",gap:"2px" }}>
        {["beginner","advanced"].map((m) => (
          <button key={m} onClick={()=>setMode(m)} style={{ flex:1,padding:"5px 8px",borderRadius:"6px",background:mode===m?template.color:"transparent",color:mode===m?"#0F172A":"#64748B",fontSize:"10px",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",border:"none",transition:"all 0.2s ease" }}>
            {m==="beginner"?"🟢 Simple":"🔵 Technical"}
          </button>
        ))}
      </div>
      <div style={{ background:"rgba(15,23,42,0.6)",border:`1px solid ${template.color}25`,borderRadius:"10px",padding:"12px",minHeight:"70px",opacity:show?1:0.3,transition:"opacity 0.5s ease" }}>
        {show
          ? <p style={{ color:"#CBD5E1",fontSize:"12px",lineHeight:1.65,margin:0,animation:"fadeIn 0.4s ease" }}>{sim.explanation?.[mode]||"Explanation not available."}</p>
          : <p style={{ color:"#475569",fontSize:"12px",lineHeight:1.6,margin:0 }}>Run the simulation to see an explanation...</p>
        }
      </div>
    </div>
  );
}

// ─── CODE EDITOR ─────────────────────────────────────────────────────────────

function CodeEditor({ code = "", onChange, templateColor, onRun, isRunning, parseErrors = [], aiMode }) {
  const [isFocused, setIsFocused] = useState(false);
  const highlightRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Synchronizes the background div's scroll with the textarea
  const handleScroll = (e) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.target.scrollTop;
      highlightRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const safeHighlight = (text) => {
    return typeof highlight === 'function' ? highlight(text) : text;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:"8px", minHeight:0 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
        <div style={{ display:"flex", gap:"5px" }}>
          {["#F87171","#FBBF24","#34D399"].map((c)=><div key={c} style={{ width:"9px", height:"9px", borderRadius:"50%", background:c, opacity:0.7 }} />)}
        </div>
        <span style={{ color:"#475569", fontSize:"10px", fontFamily:"monospace", flex:1 }}>main.move</span>
        <div style={{ color:"#64748B", fontSize:"9px", background:"#1E293B", padding:"2px 6px", borderRadius:"4px" }}>Move</div>
      </div>

      {/* Editor Container */}
      <div style={{ flex:1, position:"relative", background:"rgba(7,13,26,0.8)", border:`1px solid ${isFocused ? templateColor + "40" : "#1E293B"}`, borderRadius:"10px", overflow:"hidden", transition:"border-color 0.3s ease", minHeight: isMobile ? "200px" : 0 }}>
        
        {/* 1. Highlight Layer: pointerEvents="none" makes it "ghost-like" so you can click through it */}
        <div
          ref={highlightRef}
          style={{ position:"absolute", inset:0, padding:isMobile?"8px":"14px", fontFamily:"'JetBrains Mono', monospace", fontSize:isMobile?"10px":"11px", lineHeight:isMobile?"16px":"18px", color:"#E2E8F0", whiteSpace:"pre", overflow:"hidden", pointerEvents:"none", zIndex:1 }}
          dangerouslySetInnerHTML={{ __html: safeHighlight(code) }}
        />

        {/* 2. Textarea Layer: Higher zIndex and overflow="auto" makes the scrollbar visible and draggable */}
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onScroll={handleScroll}
          spellCheck={false}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", padding:isMobile?"8px":"14px", fontFamily:"'JetBrains Mono', monospace", fontSize:isMobile?"10px":"11px", lineHeight:isMobile?"16px":"18px", color:"transparent", caretColor:templateColor, background:"transparent", border:"none", outline:"none", resize:"none", zIndex:2, whiteSpace:"pre", overflow:"auto" }}
        />
      </div>

      {/* Footer / Errors */}
      <div style={{ flexShrink:0, display:"flex", flexDirection:"column", gap:"4px" }}>
        {parseErrors.map((e, i) => (
          <div key={i} style={{ padding:"7px 10px", borderRadius:"7px", fontSize:"11px", background:e.type==="error"?"rgba(248,113,113,0.1)":"rgba(251,191,36,0.1)", border:`1px solid ${e.type==="error"?"#F8717140":"#FBBF2440"}`, color:e.type==="error"?"#F87171":"#FCD34D", lineHeight:1.4 }}>
            {e.type === "error" ? "✕ " : "⚠ "}{e.msg}
          </div>
        ))}
        {aiMode && (
          <div style={{ padding:"6px 10px", borderRadius:"7px", fontSize:"10px", background:"rgba(99,102,241,0.1)", border:"1px solid #6366F140", color:"#818CF8", display:"flex", alignItems:"center", gap:"6px" }}>
            ✦ Simulated by Gemini Flash 2.5
          </div>
        )}
      </div>

      <button onClick={onRun} disabled={isRunning} style={{ flexShrink:0, padding:"10px 16px", background:isRunning ? `${templateColor}40` : templateColor, color:"#0F172A", borderRadius:"8px", border:"none", cursor:isRunning ? "not-allowed" : "pointer", fontWeight:800, fontSize:"12px", textTransform:"uppercase", transition:"all 0.3s ease", boxShadow:isRunning ? "none" : `0 4px 20px ${templateColor}50` }}>
        {isRunning ? "Simulating..." : "Run Simulation"}
      </button>
    </div>
  );
}


// ─── HELPERS ─────────────────────────────────────────────────────────────────

function Section({ label, color, children }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
  return (
    <div>
      <div className="section-label" style={{ color:"#475569",fontSize:isMobile?"11px":"9px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"8px",display:"flex",alignItems:"center",gap:"6px" }}>
        <div style={{ width:"3px",height:"3px",borderRadius:"50%",background:color,flexShrink:0 }} />{label}
      </div>
      {children}
    </div>
  );
}

function ControlBtn({ onClick, disabled, children, title, active }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
  return (
    <button className="control-btn" onClick={onClick} disabled={disabled} title={title} style={{ width:isMobile?"44px":"30px",height:isMobile?"44px":"30px",display:"flex",alignItems:"center",justifyContent:"center",background:active?"#1E293B":"transparent",border:"1px solid #1E293B",borderRadius:"6px",color:disabled?"#1E293B":"#64748B",cursor:disabled?"not-allowed":"pointer",transition:"all 0.2s ease" }}
      onMouseEnter={(e)=>!disabled&&(e.currentTarget.style.color="#E2E8F0")} onMouseLeave={(e)=>!disabled&&(e.currentTarget.style.color="#64748B")}>
      {children}
    </button>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function Suimulate() {
  const [selectedTemplate, setSelectedTemplate] = useState("transfer");
  const [code, setCode] = useState(TEMPLATES.transfer.code);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => { try { return localStorage.getItem("gemini_key")||""; } catch { return ""; } });
  const [parseErrors, setParseErrors] = useState([]);
  const [aiMode, setAiMode] = useState(false);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [dynamicSim, setDynamicSim] = useState(null);
  const autoPlayRef = useRef(null);

  const template = TEMPLATES[selectedTemplate];
  const activeSim = dynamicSim || template.simulation;
  const totalSteps = activeSim.steps.length;

  useEffect(() => { setMounted(true); }, []);

  const clearAutoPlay = () => { if (autoPlayRef.current){clearInterval(autoPlayRef.current);autoPlayRef.current=null;} setIsAutoPlaying(false); };

  const selectTemplate = (id) => {
    clearAutoPlay();
    setSelectedTemplate(id); setCode(TEMPLATES[id].code);
    setCurrentStep(0); setIsRunning(false); setIsComplete(false);
    setDynamicSim(null); setParseErrors([]); setAiMode(false);
  };

  const runSimulation = async () => {
    if (isRunning) return;
    clearAutoPlay();
    setIsRunning(true); setIsComplete(false); setCurrentStep(0); setAiMode(false); setParseErrors([]);

    const funMatches = [...code.matchAll(/fun\s+(\w+)\s*\(/g)].map(m=>m[1]);
    const unknown = funMatches.filter(f=>!KNOWN_FUNCTIONS[selectedTemplate]?.includes(f));
    const hasCustom = unknown.length > 0;

    let simToUse = null;

    if (hasCustom && geminiKey) {
      try {
        const ai = await simulateWithGemini(code, geminiKey);
        simToUse = { initialState:ai.initialState, steps:ai.steps, finalState:ai.finalState, explanation:ai.explanation, edgeLabel:ai.edgeLabel||"→", layout:"transfer" };
        setAiMode(true);
      } catch(e) {
        setParseErrors([{ type:"error", msg:`Gemini error: ${e.message}` }]);
        setIsRunning(false); return;
      }
    } else if (hasCustom && !geminiKey) {
      setParseErrors([{ type:"warn", msg:`Custom function "${unknown[0]}" detected. Add your free Gemini key to simulate it with AI!` }]);
      setIsRunning(false); return;
    } else {
      const { params, errors } = parseCodeParams(code, selectedTemplate);
      setParseErrors(errors);
      if (errors.some(e=>e.type==="error")) { setIsRunning(false); return; }
      simToUse = buildSimulationFromParams(selectedTemplate, params);
    }

    setDynamicSim(simToUse);
    await sleep(350);
    for (let i=1; i<=simToUse.steps.length; i++) { setCurrentStep(i); await sleep(750/speed); }
    setIsComplete(true); setIsRunning(false);
  };

  const handleReset = () => { clearAutoPlay(); setCurrentStep(0); setIsComplete(false); setIsRunning(false); setDynamicSim(null); setParseErrors([]); setAiMode(false); };
  const handleStepBack = () => { clearAutoPlay(); if(currentStep>0){setCurrentStep(s=>s-1);setIsComplete(false);} };
  const handleStepForward = () => { clearAutoPlay(); if(currentStep<totalSteps){const n=currentStep+1;setCurrentStep(n);if(n>=totalSteps)setIsComplete(true);} };
  const handleReplay = () => { if(isAutoPlaying){clearAutoPlay();return;} handleReset(); setTimeout(()=>runSimulation(),300); };
  const handleStepClick = (id) => { clearAutoPlay(); setCurrentStep(id); setIsComplete(id>=totalSteps); };

  if (!mounted) return null;

  return (
    <div style={{ minHeight:"100vh",background:"#070D1A",color:"#E2E8F0",fontFamily:"'Inter','SF Pro Display',system-ui,sans-serif",display:"flex",flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseWallet{0%,100%{box-shadow:0 0 16px #A78BFA60}50%{box-shadow:0 0 30px #A78BFA90}}
        @keyframes spin{to{transform:rotate(360deg)}}
        button{font-family:inherit;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#1E293B;border-radius:2px;}
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto auto auto !important;
            overflow-y: auto !important;
          }
          .panel-left { min-height: 350px; border-right: none !important; border-bottom: 1px solid #0F172A; }
          .panel-center { min-height: 350px; }
          .panel-right { min-height: 350px; border-left: none !important; border-top: 1px solid #0F172A; }
        }
        @media (max-width: 480px) {
          .state-panel-grid {
            grid-template-columns: 1fr !important;
          }
          .gemini-key-panel {
            width: 90% !important;
            max-width: 400px !important;
          }
          .control-btn {
            width: 44px !important;
            height: 44px !important;
          }
          .section-label {
            font-size: 11px !important;
          }
          .viz-container {
            transform: scale(0.8);
          }
          .row-1 {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .row-1 > div:last-child {
            width: 100% !important;
            justify-content: space-between !important;
          }
        }
      `}</style>

      {showKeyPanel && <GeminiKeyPanel geminiKey={geminiKey} onSave={setGeminiKey} onClose={()=>setShowKeyPanel(false)} />}

      {/* HEADER */}
      <header style={{ padding:"12px",borderBottom:"1px solid #0F172A",display:"flex",flexDirection:"column",gap:"12px",background:"rgba(7,13,26,0.96)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100 }}>
        {/* Row 1: Logo + Controls */}
        <div className="row-1" style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          {/* Logo */}
          <div style={{ display:"flex",alignItems:"center",gap:"10px",flexShrink:0 }}>
            <div style={{ width:"32px",height:"32px",background:`linear-gradient(135deg, ${template.color}, ${template.color}80)`,borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",boxShadow:`0 0 16px ${template.color}40`,transition:"all 0.4s ease" }}>◈</div>
            <div>
              <div style={{ fontWeight:900,fontSize:"16px",letterSpacing:"-0.04em",color:"#F1F5F9" }}>Suimulate</div>
              <div style={{ color:"#475569",fontSize:"9px",letterSpacing:"0.08em",textTransform:"uppercase" }}>Move Visualizer · Sui Blockchain</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap" }}>
            {/* Gemini key */}
            <button onClick={()=>setShowKeyPanel(true)} style={{ display:"flex",alignItems:"center",gap:"6px",padding:"5px 11px",borderRadius:"20px",background:geminiKey?"rgba(99,102,241,0.15)":"transparent",border:`1px solid ${geminiKey?"#6366F160":"#1E293B"}`,color:geminiKey?"#818CF8":"#64748B",fontSize:"11px",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0 }}>
              {geminiKey?"✦ AI On":"✦ Add Gemini Key"}
            </button>
            {/* Speed */}
            <div style={{ display:"flex",alignItems:"center",gap:"5px",flexShrink:0 }}>
              <span style={{ color:"#475569",fontSize:"10px" }}>Speed</span>
              <div style={{ display:"flex",background:"#0F172A",border:"1px solid #1E293B",borderRadius:"6px",overflow:"hidden" }}>
                {[0.5,1,2].map((s)=>(
                  <button key={s} onClick={()=>setSpeed(s)} style={{ padding:"3px 7px",background:speed===s?"#1E293B":"transparent",color:speed===s?"#E2E8F0":"#475569",fontSize:"10px",fontWeight:700,border:"none",cursor:"pointer" }}>{s}×</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Templates */}
        <div className="row-2" style={{ width: "100%" }}>
          {/* Templates */}
          <div style={{ display:"flex",gap:"5px", overflowX: "auto", whiteSpace: "nowrap", width: "100%", paddingBottom: "4px", justifyContent: "center"}}>
            {Object.values(TEMPLATES).map((t)=>(
              <button key={t.id} onClick={()=>selectTemplate(t.id)} style={{ padding:"5px 11px",borderRadius:"20px",background:selectedTemplate===t.id?`${t.color}20`:"transparent",border:`1px solid ${selectedTemplate===t.id?t.color+"60":"#1E293B"}`,color:selectedTemplate===t.id?t.color:"#64748B",fontSize:"11px",fontWeight:selectedTemplate===t.id?700:500,cursor:"pointer",transition:"all 0.2s ease",whiteSpace:"nowrap" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

       
      </header>

      {/* HERO */}
      <div style={{ padding:"16px 20px 12px",textAlign:"center",flexShrink:0 }}>
        <h1 style={{ fontSize:"26px",fontWeight:900,letterSpacing:"-0.04em",background:`linear-gradient(135deg, #F1F5F9 40%, ${template.color})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:"5px",transition:"all 0.5s ease" }}>
          Understand Move by Seeing It
        </h1>
        <p style={{ color:"#64748B",fontSize:"12px" }}>
          Visualize how Sui transactions and objects behave in real time
          {!geminiKey && <span onClick={()=>setShowKeyPanel(true)} style={{ color:"#6366F1",marginLeft:"8px",cursor:"pointer",textDecoration:"underline dotted" }}>+ Add Gemini key for AI simulation</span>}
        </p>
      </div>

      {/* MAIN GRID — responsive columns */}
      <div className="main-grid" style={{
        flex:1,
        display:"grid",
        gridTemplateColumns:"minmax(280px, 600px) minmax(430px, 1fr) minmax(280px, 600px)",
        gridTemplateRows:"1fr",
        gap:"1px",
        background:"#0F172A",
        margin:"0 12px 12px",
        borderRadius:"14px",
        overflow:"hidden",
        border:"1px solid #1E293B",
        minHeight:"580px",
      }}>

        {/* LEFT: Code editor — scrollable */}
        <div className="panel-left" style={{ background:"#070D1A",padding:"14px",display:"flex",flexDirection:"column",borderRight:"1px solid #0F172A",overflow:"hidden",minHeight:0 }}>
          <CodeEditor code={code} onChange={setCode} templateColor={template.color} onRun={runSimulation} isRunning={isRunning} parseErrors={parseErrors} aiMode={aiMode} />
        </div>

        {/* CENTER: Visualization */}
        <div className="panel-center" style={{ background:"#070D1A",display:"flex",flexDirection:"column",minHeight:0 }}>
          <div style={{ flex:1,position:"relative",overflow:"hidden" }}>
            <VisualizationCanvas template={template} sim={activeSim} currentStep={currentStep} isComplete={isComplete} />
          </div>
          {/* Controls */}
          <div style={{ borderTop:"1px solid #0F172A",padding:"10px 14px",display:"flex",alignItems:"center",gap:"10px",background:"rgba(7,13,26,0.8)",flexShrink:0 }}>
            <div style={{ display:"flex",gap:"4px" }}>
              <ControlBtn onClick={handleStepBack} disabled={currentStep===0} title="Step Back"><StepBackIcon /></ControlBtn>
              <ControlBtn onClick={handleStepForward} disabled={currentStep>=totalSteps} title="Step Forward"><StepForwardIcon /></ControlBtn>
              <ControlBtn onClick={handleReplay} title="Replay" active={isAutoPlaying}><ReplayIcon /></ControlBtn>
            </div>
            <div style={{ flex:1,height:"4px",background:"#0F172A",borderRadius:"2px",overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${(currentStep/totalSteps)*100}%`,background:`linear-gradient(90deg, ${template.color}80, ${template.color})`,borderRadius:"2px",transition:"width 0.4s ease" }} />
            </div>
            <span style={{ color:"#475569",fontSize:"10px",fontFamily:"monospace",whiteSpace:"nowrap" }}>{currentStep}/{totalSteps}</span>
            <button onClick={handleReset} style={{ color:"#475569",background:"transparent",border:"none",cursor:"pointer",fontSize:"10px",padding:"3px 7px",borderRadius:"4px" }}
              onMouseEnter={(e)=>e.target.style.color="#94A3B8"} onMouseLeave={(e)=>e.target.style.color="#475569"}>Reset</button>
          </div>
        </div>

        {/* RIGHT: State + Timeline + Explanation — scrollable, grows with width */}
        <div className="panel-right" style={{ background:"#070D1A",borderLeft:"1px solid #0F172A",display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0 }}>
          <div style={{ flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:"16px" }}>
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
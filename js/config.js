/* ============================================================
   MOSPHATE_CONFIG — every string and asset path lives here.
   Edit text, add/remove team slots, drop files into /assets/...
   and set the paths below. Missing files fall back to the
   procedural 3D version automatically (no crashes, no 404 UI).
   ============================================================ */
window.MOSPHATE_CONFIG = {
  brand: { name: "MOSPHATE", tagline: "STAY CONNECTED, STAY LIMITLESS." },

  hero: {
    sub: "BEYOND THE PIXELS.",
    copy: "An iconic digital inspiration, reimagined as a physical creation.",
    cta: "ENTER THE EXPERIENCE"
  },

  about: {
    heading: "EVERY ICON HAS A STORY.",
    blocks: [
      { tag: "WHAT IT IS", title: "A pixel, with weight.",
        text: "MOSPHATE takes one of the most recognizable shapes in internet history and gives it mass, edges and a shelf to stand on. A digital icon, rebuilt as an object you can hold." },
      { tag: "THE MASCOT", title: "Drawn in squares.",
        text: "A lone dinosaur made of a few dozen blocks. The silhouette is so simple that anyone can sketch it from memory, and that simplicity is the blueprint." },
      { tag: "WHY THE DINO", title: "It keeps running.",
        text: "It shows up when the connection drops, and it runs anyway. To us that is resilience and offline creativity in one small character." },
      { tag: "PIXELS TO PHYSICAL", title: "Nostalgia you can touch.",
        text: "Every voxel on screen becomes a decision in the studio: proportion, finish, edge. Digital memory, turned into craft." }
    ]
  },

  mascot: {
    heading: "MEET THE MASCOT",
    lead: "Drag to orbit, pick a camera, and look closely. Every voxel is placed on purpose.",
    // Universal media slot. Leave empty to use the procedural voxel mascot.
    model:   "",   // e.g. "assets/mascot/mascot.glb"
    gallery: [],   // e.g. ["assets/mascot/mascot-front.webp", "assets/product/detail-shots.jpg"]
    video:   ""    // e.g. "assets/product/product-turntable.mp4"
  },

  packaging: {
    heading: "THE COLLECTOR BOX",
    lead: "A sleeve that slides, a tray that unfolds, a mascot that rises. Unbox it here first.",
    front: "",     // e.g. "assets/packaging/box-front.png"
    back:  "",     // e.g. "assets/packaging/box-back.png"
    model: ""      // e.g. "assets/packaging/packaging.glb"
  },

  specs: {
    heading: "PRODUCT SPECIFICATIONS",
    // ph:true marks a placeholder. Replace v and set ph:false when real data exists.
    rows: [
      { k: "PRODUCT NAME",        v: "[MOSPHATE COLLECTIBLE EDITION — TBD]", ph: true },
      { k: "PRODUCT DESCRIPTION", v: "[Awaiting official product copy]", ph: true },
      { k: "DIMENSIONS",          v: "[__ mm × __ mm × __ mm — Placeholder]", ph: true },
      { k: "MATERIAL",            v: "[Primary & finish materials — Placeholder]", ph: true },
      { k: "DESIGN INSPIRATION",  v: "Chrome Dino / Monochrome Voxel Heritage", ph: false },
      { k: "PACKAGING",           v: "[Custom collector box details — Placeholder]", ph: true },
      { k: "SPECIAL FEATURES",    v: "[Feature 01 / Feature 02 / Feature 03 — Placeholders]", ph: true, wide: true }
    ]
  },

  journey: {
    heading: "FROM PIXELS TO PHYSICAL.",
    steps: [
      { n: "01", name: "IDEA",          sub: "Concept & Spark",         slot: "Placeholder slot for concept notes / mood", media: "" },
      { n: "02", name: "DESIGN",        sub: "Form & Silhouette",       slot: "Placeholder slot for design sketches", media: "" },
      { n: "03", name: "DIGITAL MODEL", sub: "Voxel & CAD Engineering", slot: "Placeholder slot for CAD screenshots", media: "" },
      { n: "04", name: "PROTOTYPE",     sub: "Physical Testing",        slot: "Placeholder slot for prototype photos", media: "" },
      { n: "05", name: "FINAL PRODUCT", sub: "Production & Packaging",  slot: "Placeholder slot for final product video / photos", media: "" }
    ]
  },

  team: {
    heading: "THE MINDS BEHIND THE MASCOT.",
    sub: "Different minds. One vision. Infinite possibilities.",
    // Add, edit or remove objects. The grid adapts on its own.
    members: [
      { photo: "", name: "", role: "", desc: "" },
      { photo: "", name: "", role: "", desc: "" },
      { photo: "", name: "", role: "", desc: "" },
      { photo: "", name: "", role: "", desc: "" }
    ]
  },

  finale: { line: "THE GAME NEVER ENDS.", tagline: "STAY CONNECTED, STAY LIMITLESS." },

  contact: {
    email: "",   // e.g. "hello@yourdomain.com"
    socials: [
      { name: "Instagram", url: "" },
      { name: "X / Twitter", url: "" },
      { name: "LinkedIn", url: "" },
      { name: "YouTube", url: "" },
      { name: "Discord", url: "" }
    ]
  }
};

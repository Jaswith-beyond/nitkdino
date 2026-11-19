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
        text: "MOSPHATE transforms the iconic Chrome Dino into a physical collectible, giving a familiar digital character a new form through 3D design, geometry and craftsmanship." },
      { tag: "THE MASCOT", title: "Born from pixels.",
        text: "Inspired by the minimal pixel structure of the Chrome Dino, its recognizable silhouette is recreated through carefully designed geometric forms." },
      { tag: "WHY THE DINO", title: "A symbol of offline creativity.",
        text: "The Chrome Dino represents the little moments when the internet disappears but creativity doesn't. A simple character that became an icon of the digital world." },
      { tag: "PIXELS TO PHYSICAL", title: "Nostalgia you can hold.",
        text: "What once existed only on a screen is now a tangible object. Every dimension, surface and detail is translated from digital pixels into a physical creation." }
    ]
  },

  video: {
    eyebrow: "TRANSMISSION",
    heading: "THE DINO HAS SOMETHING TO SAY.",
    src: "assets/product/dino-speaks.mp4",
    poster: "assets/product/dino-poster.jpg"
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
    heading: "THE COLLECTOR PACK",
    lead: "A flat display card with a platform that folds out. The dino stands on it, outside the package.",
    front: "assets/packaging/box-front.jpg",   // front face of the box (shown as-is)
    back:  "",     // e.g. "assets/packaging/box-back.png"
    model: ""      // e.g. "assets/packaging/packaging.glb"
  },

  specs: {
    heading: "PRODUCT SPECIFICATIONS",
    // ph:true marks a placeholder. Replace v and set ph:false when real data exists.
    // ph:true marks a placeholder (dashed TBD tag). v may be a string or an array (shown as a list).
    rows: [
      { k: "PRODUCT NAME",        v: "MOSPHATE – Chrome Dino Collectible Edition" },
      { k: "PRODUCT DESCRIPTION", v: "A Chrome Dino-inspired collectible product that combines retro pixel aesthetics with a creative MOSFET-themed design. Designed as a unique desk collectible with distinctive packaging." },
      { k: "DIMENSIONS",          v: "60 mm × 60 mm × 60 mm" },
      { k: "MATERIAL",            v: "3D-printed PLA / Acrylic / Cardboard packaging" },
      { k: "DESIGN INSPIRATION",  v: "Google Chrome Dino / Retro Pixel Art / Monochrome Voxel Aesthetics / Industrial Design" },
      { k: "PACKAGING",           v: "Custom-designed cube packaging featuring Chrome Dino-inspired graphics, monochrome styling and product branding." },
      { k: "SPECIAL FEATURES",    wide: true, v: [
        "Chrome Dino-inspired collectible design",
        "Custom 3D-designed packaging",
        "Compact 60 mm cube form factor",
        "Retro pixel-art visual identity",
        "Unique MOSPHATE branding"
      ] }
    ]
  },

  team: {
    heading: "THE MINDS BEHIND THE MASCOT.",
    sub: "Different minds. One vision. Infinite possibilities.",
    // Add, edit or remove objects. The grid adapts on its own.
    members: [
      { photo: "assets/team/Jaswith.png", name: "Jaswith", role: "Team Leader", desc: "Main character energy. Holds the vision together and keeps the squad moving." },
      { photo: "assets/team/Madhav Srinivasan.jpeg", name: "Madhav Srinivasan", role: "Big Brain", desc: "Thinks three steps ahead. If it's complicated, he's already solved it." },
      { photo: "assets/team/Samarth patil.jpeg", name: "Samarth Patil", role: "Certified Cool", desc: "Effortless vibes. Walks in and the whole room gets an upgrade." },
      { photo: "assets/team/NS vivek .jpeg", name: "NS Vivek", role: "Ultimate Supporter", desc: "Always has the squad's back. The reason things actually get done." },
      { photo: "assets/team/Garimey.jpeg", name: "Garimey", role: "Spark", desc: "Just for a sec" },
      { photo: "assets/team/Vivek G.jpeg", name: "Vivek G.", role: "Wildcard", desc: "Unpredictable in the best way. Shows up with the plot twist." },
      { photo: "assets/team/Kaivalya Vijay Gharge.jpeg", name: "Kaivalya Vijay Gharge", role: "Cool Dude", desc: "Silent and cool ." }
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

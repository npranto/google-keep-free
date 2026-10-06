const inner = "mx-auto w-full max-w-5xl px-6 py-16 md:py-24";
const heading = "text-3xl font-black tracking-tight md:text-4xl";

const stats = [
  {
    id: "flumbs",
    value: "4,096",
    label: "flumbs per snorp",
    tone: "bg-rose-700 text-white",
  },
  {
    id: "wibbles",
    value: "17.3k",
    label: "wibbles in orbit",
    tone: "bg-amber-400 text-amber-950",
  },
  {
    id: "zorps",
    value: "88%",
    label: "zorps fully gronked",
    tone: "bg-emerald-500 text-emerald-950",
  },
  {
    id: "quibs",
    value: "3x",
    label: "quibs per glimmer",
    tone: "bg-sky-700 text-white",
  },
];

const cards = [
  {
    id: "glimmerwick",
    title: "Glimmerwick",
    body: "A lopsided blorp that hums whenever the snazzle lines up with the dribble.",
    tone: "from-pink-500 to-orange-400 text-white",
  },
  {
    id: "snorbel",
    title: "Snorbel Deluxe",
    body: "Fourteen tiny flonks, one big wazzle, and a pocket full of borrowed thunder.",
    tone: "from-violet-600 to-indigo-500 text-white",
  },
  {
    id: "quillfrump",
    title: "Quillfrump",
    body: "Writes itself backwards on rainy tuesdays and forgets every third vowel.",
    tone: "from-emerald-400 to-teal-500 text-teal-950",
  },
  {
    id: "dazzlepunk",
    title: "Dazzlepunk",
    body: "The loudest silence in the whole zibble, packed neatly inside a cardboard cloud.",
    tone: "from-yellow-300 to-lime-400 text-lime-950",
  },
  {
    id: "morpwhistle",
    title: "Morpwhistle",
    body: "Whistles in seven colors and answers to nothing but a well-timed hiccup.",
    tone: "from-cyan-400 to-blue-500 text-white",
  },
  {
    id: "tumblezap",
    title: "Tumblezap",
    body: "Rolls uphill on purpose, then apologizes to every pebble it meets.",
    tone: "from-fuchsia-500 to-rose-500 text-white",
  },
];

const chipRows = [
  [
    "blorp",
    "wazzle",
    "flonk",
    "snazzle",
    "dribble",
    "zibble",
    "gronk",
    "quib",
    "mizzle",
  ],
  [
    "thunderlump",
    "pebblesnort",
    "cloudwhisk",
    "hiccupwind",
    "marblezest",
    "fizzwobble",
  ],
  [
    "zorp",
    "wibble",
    "snorp",
    "flumb",
    "glimmer",
    "tumble",
    "frump",
    "dazzle",
    "punk",
  ],
];

const chipTones = [
  "bg-pink-400 text-pink-950",
  "bg-yellow-300 text-yellow-950",
  "bg-cyan-300 text-cyan-950",
  "bg-lime-300 text-lime-950",
  "bg-violet-400 text-violet-950",
  "bg-orange-400 text-orange-950",
];

const timeline = [
  {
    id: "t1",
    when: "Dawn of Blorp",
    what: "The first wazzle wobbled free of the snazzle and nobody noticed.",
  },
  {
    id: "t2",
    when: "Era of Flonk",
    what: "Fourteen dribbles formed a committee and immediately lost the minutes.",
  },
  {
    id: "t3",
    when: "The Great Zibble",
    what: "A cardboard cloud rained confetti for nine days, give or take a Tuesday.",
  },
  {
    id: "t4",
    when: "Gronk Revival",
    what: "Everything that was backwards turned forwards, then sideways, then purple.",
  },
  {
    id: "t5",
    when: "Quib Summit",
    what: "Three quibs per glimmer became the official unit of fizzing.",
  },
  {
    id: "t6",
    when: "Today, probably",
    what: "You are here, scrolling through a perfectly unnecessary amount of stuff.",
  },
];

const tiers = [
  {
    id: "snack",
    name: "Snack Size",
    price: "3 flumbs",
    perks: ["One mild blorp", "Half a wazzle", "Hiccups on request"],
    tone: "bg-white text-slate-900",
  },
  {
    id: "feast",
    name: "Full Feast",
    price: "17 flumbs",
    perks: ["Unlimited snazzle", "Two whole zibbles", "A cloud, boxed"],
    tone: "bg-amber-300 text-amber-950 md:-translate-y-4",
  },
  {
    id: "banquet",
    name: "Banquet of Gronk",
    price: "88 flumbs",
    perks: ["Everything, twice", "Thunder on the side", "Your own pebble"],
    tone: "bg-white text-slate-900",
  },
];

const bigNumbers = [
  {
    id: "n1",
    value: "007",
    label: "snorps",
    tone: "from-pink-400 to-orange-300",
  },
  {
    id: "n2",
    value: "1,024",
    label: "flonks",
    tone: "from-cyan-300 to-emerald-300",
  },
  {
    id: "n3",
    value: "9.99",
    label: "wibbles",
    tone: "from-yellow-200 to-pink-400",
  },
  {
    id: "n4",
    value: "42x",
    label: "quibs",
    tone: "from-violet-300 to-sky-300",
  },
];

const checklist = [
  "Polish the loudest silence",
  "Water the cardboard cloud",
  "Teach the pebble to whistle",
  "Rewind the wazzle gently",
  "Count the dribbles twice",
  "Apologize to the tumblezap",
  "Fold the thunder into thirds",
  "Return the borrowed snazzle",
  "Forget one vowel on purpose",
  "Hum in seven colors",
];

const faqs = [
  {
    id: "q1",
    q: "Why is the blorp lopsided?",
    a: "Because the wazzle leans left on weekdays and the snazzle leans right out of spite.",
  },
  {
    id: "q2",
    q: "How many flumbs fit in a snorp?",
    a: "Four thousand ninety-six, unless the snorp is feeling shy, in which case three.",
  },
  {
    id: "q3",
    q: "Can a cloud really be boxed?",
    a: "Only a cardboard one, and only after it has finished raining confetti.",
  },
  {
    id: "q4",
    q: "Is the gronk contagious?",
    a: "Mildly. Symptoms include humming, backwards spelling and a sudden love of pebbles.",
  },
  {
    id: "q5",
    q: "What does a quib actually do?",
    a: "It quibs. Three of them per glimmer, no more, no less, no refunds.",
  },
];

const tags = [
  { id: "g1", label: "blorp", size: "text-4xl font-black" },
  { id: "g2", label: "wazzle", size: "text-xl" },
  { id: "g3", label: "snazzle", size: "text-3xl font-bold" },
  { id: "g4", label: "flonk", size: "text-lg" },
  { id: "g5", label: "dribble", size: "text-2xl font-semibold" },
  { id: "g6", label: "zibble", size: "text-5xl font-black" },
  { id: "g7", label: "gronk", size: "text-base" },
  { id: "g8", label: "quib", size: "text-3xl" },
  { id: "g9", label: "mizzle", size: "text-xl font-bold" },
  { id: "g10", label: "thunderlump", size: "text-2xl" },
  { id: "g11", label: "pebblesnort", size: "text-4xl font-bold" },
  { id: "g12", label: "hiccupwind", size: "text-lg font-semibold" },
  { id: "g13", label: "marblezest", size: "text-3xl font-black" },
  { id: "g14", label: "fizzwobble", size: "text-xl" },
];

const tagTones = [
  "text-rose-700",
  "text-indigo-700",
  "text-emerald-600",
  "text-orange-700",
  "text-fuchsia-600",
  "text-sky-700",
];

const steps = [
  {
    id: "s1",
    title: "Find a blorp",
    body: "Any blorp will do, but lopsided ones hum louder.",
  },
  {
    id: "s2",
    title: "Feed the wazzle",
    body: "Two snazzles, one dribble, and a pinch of thunder.",
  },
  {
    id: "s3",
    title: "Wait politely",
    body: "Count to fourteen flonks without looking at the cloud.",
  },
  {
    id: "s4",
    title: "Gently gronk",
    body: "Backwards first, then sideways, then in a circle.",
  },
  {
    id: "s5",
    title: "Admire the zibble",
    body: "It will wobble. This is normal. Do not panic.",
  },
];

const stepTones = [
  "bg-white/90 text-orange-900",
  "bg-white/80 text-rose-900",
  "bg-white/90 text-fuchsia-900",
  "bg-white/80 text-violet-900",
  "bg-white/90 text-indigo-900",
];

const swatches = [
  { id: "c1", name: "Blorp Pink", tone: "bg-pink-600 text-white" },
  { id: "c2", name: "Wazzle Orange", tone: "bg-orange-500 text-orange-950" },
  { id: "c3", name: "Snazzle Yellow", tone: "bg-yellow-300 text-yellow-950" },
  { id: "c4", name: "Dribble Lime", tone: "bg-lime-400 text-lime-950" },
  { id: "c5", name: "Zibble Green", tone: "bg-emerald-500 text-emerald-950" },
  { id: "c6", name: "Gronk Teal", tone: "bg-teal-500 text-teal-950" },
  { id: "c7", name: "Quib Cyan", tone: "bg-cyan-400 text-cyan-950" },
  { id: "c8", name: "Mizzle Sky", tone: "bg-sky-500 text-sky-950" },
  { id: "c9", name: "Flonk Blue", tone: "bg-blue-600 text-white" },
  { id: "c10", name: "Thunder Violet", tone: "bg-violet-600 text-white" },
  { id: "c11", name: "Pebble Fuchsia", tone: "bg-fuchsia-600 text-white" },
  { id: "c12", name: "Hiccup Rose", tone: "bg-rose-600 text-white" },
];

const praise = [
  {
    id: "p1",
    quote:
      "I scrolled for an hour and learned absolutely nothing. Ten out of ten.",
    who: "A very calm snorp",
  },
  {
    id: "p2",
    quote:
      "The blorp changed my life, then changed it back, then changed the subject.",
    who: "Quillfrump, retired",
  },
  {
    id: "p3",
    quote: "Never has a cardboard cloud rained so confidently on my parade.",
    who: "Dazzlepunk, weather desk",
  },
];

const poem = [
  {
    id: "v1",
    text: "Once upon a wazzle, a snazzle lost its way, and wandered through the dribble where the flonks like to play. The blorp was feeling lopsided, the zibble feeling blue, so they borrowed some of thunder and painted it anew.",
  },
  {
    id: "v2",
    text: "A gronk came marching backwards with a pocket full of quibs, a glimmer on its shoulder and a hiccup in its ribs. It whistled in seven colors, it hummed in two or three, and every cardboard cloud agreed that this was meant to be.",
  },
  {
    id: "v3",
    text: "The pebble learned to tumble, the tumblezap to stay, the morpwhistle forgot a vowel and then forgot the way. So here we are, still scrolling, past the snorp and past the flumb, where the stuff keeps getting stuffer and the bottom does not come.",
  },
];

export default function StuffPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* 1. Hero */}
      <section className="bg-linear-to-br from-violet-700 via-fuchsia-600 to-orange-500 text-white">
        <div className={`${inner} text-center`}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
            A very long page
          </p>
          <h1 className="mt-4 text-6xl font-black tracking-tight md:text-8xl">
            Stuff
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/90">
            Lots of blorp, plenty of wazzle, and enough snazzle to keep your
            scroll wheel busy. None of it means anything.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-fuchsia-700 shadow-lg"
            >
              Start scrolling
            </button>
            <button
              type="button"
              className="rounded-full border-2 border-white/80 px-6 py-3 text-sm font-bold text-white"
            >
              Never stop
            </button>
          </div>
        </div>
      </section>

      {/* 2. Stat tiles */}
      <section className="bg-slate-50 text-slate-900">
        <div className={inner}>
          <h2 className={heading}>The numbers, loosely</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.id} className={`rounded-3xl p-6 shadow-md ${s.tone}`}>
                <p className="text-4xl font-black md:text-5xl">{s.value}</p>
                <p className="mt-2 text-sm font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Card grid */}
      <section className="bg-indigo-950 text-white">
        <div className={inner}>
          <h2 className={heading}>Six excellent things</h2>
          <p className="mt-2 max-w-xl text-indigo-200">
            Each one is entirely made up and slightly out of focus.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <article
                key={c.id}
                className={`rounded-3xl bg-linear-to-br p-6 shadow-xl ${c.tone}`}
              >
                <h3 className="text-xl font-extrabold">{c.title}</h3>
                <p className="mt-3 text-sm font-medium opacity-90">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Chip rows */}
      <section className="bg-slate-900 text-white">
        <div className={`${inner} flex flex-col gap-4`}>
          <h2 className={heading}>Words we like</h2>
          {chipRows.map((row) => (
            <ul key={row[0]} className="flex flex-wrap gap-2">
              {row.map((word, i) => (
                <li
                  key={word}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold ${chipTones[i % chipTones.length]}`}
                >
                  {word}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* 5. Quote band */}
      <section className="bg-yellow-300 text-yellow-950">
        <div className={`${inner} text-center`}>
          <p
            aria-hidden="true"
            className="text-7xl font-black leading-none text-yellow-600"
          >
            &ldquo;
          </p>
          <blockquote className="mx-auto max-w-3xl text-3xl font-black leading-tight md:text-5xl">
            The loudest silence lives inside a cardboard cloud.
          </blockquote>
          <p className="mt-6 text-sm font-bold uppercase tracking-widest">
            Anonymous blorp
          </p>
        </div>
      </section>

      {/* 6. Timeline */}
      <section className="bg-emerald-950 text-emerald-50">
        <div className={inner}>
          <h2 className={heading}>A brief history of nothing</h2>
          <ol className="mt-10 border-l-4 border-emerald-400 pl-6">
            {timeline.map((t) => (
              <li key={t.id} className="relative pb-10 last:pb-0">
                <span className="absolute left-[-2.15rem] top-1 size-5 rounded-full border-4 border-emerald-950 bg-emerald-400" />
                <p className="text-sm font-bold uppercase tracking-widest text-emerald-300">
                  {t.when}
                </p>
                <p className="mt-1 max-w-2xl text-lg">{t.what}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7. Pricing-style cards */}
      <section className="bg-linear-to-b from-indigo-600 to-violet-700 text-white">
        <div className={`${inner} text-center`}>
          <h2 className={heading}>Choose your amount of stuff</h2>
          <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.id}
                className={`rounded-3xl p-8 shadow-2xl ${t.tone}`}
              >
                <h3 className="text-lg font-extrabold">{t.name}</h3>
                <p className="mt-2 text-4xl font-black">{t.price}</p>
                <ul className="mt-6 flex flex-col gap-2 text-sm font-medium">
                  {t.perks.map((perk) => (
                    <li key={perk}>
                      <span aria-hidden="true">&#10003;</span> {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Big numbers */}
      <section className="bg-black text-white">
        <div
          className={`${inner} grid grid-cols-2 gap-10 text-center md:grid-cols-4`}
        >
          {bigNumbers.map((n) => (
            <div key={n.id}>
              <p
                className={`bg-linear-to-br bg-clip-text text-5xl font-black text-transparent md:text-6xl ${n.tone}`}
              >
                {n.value}
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-white/70">
                {n.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Checklist */}
      <section className="bg-teal-100 text-teal-950">
        <div className={inner}>
          <h2 className={heading}>Things to do before tuesday</h2>
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {checklist.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 font-semibold shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-teal-500 text-sm font-black text-white"
                >
                  &#10003;
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 10. Collapsible Q&A */}
      <section className="bg-rose-100 text-rose-950">
        <div className={`${inner} max-w-3xl`}>
          <h2 className={heading}>Questions nobody asked</h2>
          <ul className="mt-8 flex flex-col gap-3">
            {faqs.map((f) => (
              <li key={f.id}>
                <details className="rounded-2xl bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer font-bold">{f.q}</summary>
                  <p className="mt-3 text-sm text-rose-900/80">{f.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 11. Tag cloud */}
      <section className="bg-sky-100">
        <div className={`${inner} text-center`}>
          <h2 className={`${heading} text-sky-950`}>
            The cloud, but for words
          </h2>
          <ul className="mt-10 flex flex-wrap items-baseline justify-center gap-x-6 gap-y-3">
            {tags.map((t, i) => (
              <li
                key={t.id}
                className={`${t.size} ${tagTones[i % tagTones.length]}`}
              >
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 12. Split feature rows */}
      <section className="bg-cyan-950 text-cyan-50">
        <div className={`${inner} flex flex-col gap-16`}>
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="aspect-video rounded-3xl bg-linear-to-br from-cyan-400 to-blue-600 shadow-2xl" />
            <div>
              <h2 className="text-2xl font-black md:text-3xl">
                Loud on the inside
              </h2>
              <p className="mt-3 text-cyan-100">
                Every wazzle carries a tiny speaker that plays the sound of a
                dribble falling upward. Nobody asked for this feature, and yet
                here it is.
              </p>
            </div>
          </div>
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="md:order-2 aspect-video rounded-3xl bg-linear-to-br from-pink-400 to-orange-500 shadow-2xl" />
            <div className="md:order-1">
              <h2 className="text-2xl font-black md:text-3xl">
                Soft on the outside
              </h2>
              <p className="mt-3 text-cyan-100">
                The snazzle is wrapped in forty layers of cloudwhisk, which is
                not a real fabric but feels exactly like one. Machine washable,
                if you own a machine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 13. Text columns */}
      <section className="bg-fuchsia-950 text-fuchsia-50">
        <div className={inner}>
          <h2 className={heading}>An epic poem, abridged</h2>
          <div className="mt-8 gap-10 space-y-6 text-lg leading-relaxed md:columns-2 md:space-y-0">
            {poem.map((verse) => (
              <p
                key={verse.id}
                className="break-inside-avoid md:mb-6 first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-black first-letter:text-pink-400"
              >
                {verse.text}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 14. Steps */}
      <section className="bg-linear-to-br from-orange-500 via-rose-500 to-fuchsia-600 text-white">
        <div className={inner}>
          <h2 className={heading}>How to blorp in five steps</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map((s, i) => (
              <li
                key={s.id}
                className={`rounded-3xl p-5 shadow-lg ${stepTones[i]}`}
              >
                <p className="text-4xl font-black">{i + 1}</p>
                <h3 className="mt-2 font-extrabold">{s.title}</h3>
                <p className="mt-1 text-sm">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 15. Swatches */}
      <section className="bg-white text-slate-900">
        <div className={inner}>
          <h2 className={heading}>Colors, officially</h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {swatches.map((c) => (
              <li
                key={c.id}
                className={`flex aspect-square items-end rounded-2xl p-3 text-sm font-bold shadow-md ${c.tone}`}
              >
                {c.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 16. Testimonials */}
      <section className="bg-violet-950 text-violet-50">
        <div className={inner}>
          <h2 className={heading}>What people say</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {praise.map((p) => (
              <figure
                key={p.id}
                className="rounded-3xl border border-violet-400/40 bg-violet-900/60 p-6"
              >
                <blockquote className="text-lg font-semibold">
                  &ldquo;{p.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm font-bold text-violet-300">
                  {p.who}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 17. Closing band */}
      <section className="bg-linear-to-r from-lime-300 via-yellow-300 to-pink-400 text-slate-900">
        <div className={`${inner} text-center`}>
          <h2 className="text-4xl font-black tracking-tight md:text-6xl">
            That is all the stuff.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg font-medium">
            Scroll back up and do it again, or do something useful instead. The
            blorp will wait.
          </p>
          <button
            type="button"
            className="mt-8 rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-lg"
          >
            More stuff
          </button>
        </div>
      </section>
    </main>
  );
}

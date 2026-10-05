const values = [
  {
    title: "Simplicity",
    description:
      "Notes should take seconds to create, not minutes to figure out.",
  },
  {
    title: "Privacy",
    description:
      "Your notes are yours. We build with that as the default, not an afterthought.",
  },
  {
    title: "Speed",
    description: "A notes app should never feel slower than pen and paper.",
  },
  {
    title: "Reliability",
    description: "The notes you save are the notes you get back, every time.",
  },
];

const team = [
  { name: "Ari Chen", role: "Product & Design", initials: "AC" },
  { name: "Jordan Blake", role: "Engineering", initials: "JB" },
  { name: "Priya Nair", role: "Engineering", initials: "PN" },
  { name: "Sam Okafor", role: "Support", initials: "SO" },
];

export default function AboutPage() {
  return (
    <main className="flex flex-1 justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            About Google Keep Free
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A calmer place to capture and organize your notes.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Our story</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            We started this project because every notes app we tried made us
            trade something away, our data, our attention, or our patience. So
            we set out to build the one we actually wanted to use.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            What began as a weekend experiment turned into a small product built
            around one idea: capturing a thought should be the easiest part of
            your day, not the hardest.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">
            What we value
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {values.map((value) => (
              <li key={value.title}>
                <p className="font-medium">{value.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {value.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">
            Meet the team
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {team.map((member) => (
              <li key={member.name} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {member.initials}
                </span>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

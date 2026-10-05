const faqs = [
  {
    id: "what-is-it",
    question: "What is Google Keep Free?",
    answer:
      "A simple notes app for capturing short thoughts and organizing them later. This is placeholder copy.",
  },
  {
    id: "is-it-free",
    question: "Is it really free?",
    answer:
      "Yes. There are no paid tiers in this example, and no credit card is needed to start.",
  },
  {
    id: "mobile",
    question: "Can I use it on my phone?",
    answer:
      "The layout is built to adapt to smaller screens, so it works in a mobile browser too.",
  },
  {
    id: "storage",
    question: "How are my notes stored?",
    answer:
      "Notes are saved to a database and tied to your account. This answer is dummy text for the example page.",
  },
  {
    id: "labels",
    question: "Can I organize notes with labels?",
    answer:
      "Labels and colors are on the roadmap. For now this question only exists to fill the page.",
  },
  {
    id: "contact",
    question: "How do I get in touch?",
    answer:
      "Contact details are not set up yet. Check back once the project has a real support address.",
  },
];

export default function FaqPage() {
  return (
    <main className="flex flex-1 items-start justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Frequently asked questions
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quick answers to the things people ask most.
          </p>
        </div>

        <ul className="mt-10 flex flex-col divide-y divide-border">
          {faqs.map((faq) => (
            <li key={faq.id}>
              <details className="py-4">
                <summary className="cursor-pointer font-medium">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

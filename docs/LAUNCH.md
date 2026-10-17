# Flowmint Launch Content

Ready-to-adapt launch copy for the Flowmint product. Written fresh for this
brand — reuse freely. (Domain `flowmint.io` is the metadata identity; confirm
registration/ownership before any public launch.)

## Positioning (one line)

> **Flowmint — AI workflows with nothing to hide.**

Visual automation for building AI agents and workflows you can inspect,
control, and trust — from first node to production scale.

## Announcement — short (social / X / LinkedIn)

> We're launching **Flowmint** — visual AI workflow automation with nothing
> to hide. Connect your apps, build agents in a node canvas, and inspect
> every execution. No black boxes.
>
> 60 integrations · 48 starter templates · honest, execution-based pricing.
>
> #Automation #AI #NoCode

## Announcement — medium (blog / Product Hunt / newsletter)

**Meet Flowmint: AI workflows with nothing to hide.**

Automation tools ask you to trust a black box. Flowmint is built on the
opposite idea: every workflow is a visible graph of nodes you can read,
every execution is inspectable, and every plan is priced on executions you
can count.

What ships today:

- **A visual node canvas** — wire apps, data, and AI agents together
  without losing the plot.
- **60 integrations** with a real request-an-integration path (not a
  suggestion box into the void).
- **48 workflow templates** — from lead capture to nightly DB backups —
  ready to adapt.
- **Honest pricing** with an executions calculator that shows its math:
  it recommends the cheapest plan whose quota covers your volume, and
  names the quota it matched.

The launch site is fully accessible, static-first, and carries no fake
trust signals: demo figures are labeled illustrative, and placeholder
testimonials are labeled fictional until real customers replace them.

## Tagline variants

- AI workflows with nothing to hide. *(primary)*
- Every node visible. Every run inspectable.
- Automation you can read.
- From first node to production scale.

## Value props (pick 3 for any surface)

1. **Inspectable by design** — see exactly what each run did, node by node.
2. **AI-native** — agents, RAG, and model-context tooling are first-class
   citizens, not plugins.
3. **Honest pricing** — execution-based, with a calculator that shows its work.
4. **Accessible for everyone** — keyboard-operable, screen-reader friendly,
   reduced-motion aware.
5. **No fake signals** — we label demo data as demo data.

## Launch checklist

- [ ] Confirm `flowmint.io` ownership; point DNS at host
- [ ] Re-verify `data/pricing.json` figures against current public prices
- [ ] Replace (or keep labeled) fictional testimonials, case studies,
      marquee marks
- [ ] Set up real newsletter/CRM destination behind `POST /api/forms`
      (currently records submissions to JSONL / PostgreSQL)
- [ ] Run `npm test` → `SMOKE OK`; run `npm run build:details` after any
      `data/*.json` change
- [ ] Submit `sitemap.xml` to search consoles; verify `robots.txt`
- [ ] Draft the social posts above into the team's scheduler
- [ ] Accessibility pass on any post-launch page additions
- [ ] Privacy review: retention (`FORM_RETENTION_DAYS`), consent rows,
      IP-hash handling — see `reports/agent03-database.md` § Security

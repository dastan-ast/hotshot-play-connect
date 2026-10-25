<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Subscription quantities stay in the domain catalogue; prices and scheduled discounts live in public.subscription_pricing, with admin-only writes and a shared Almaty-date calculation so checkout matches the catalogue.
- Payment amounts are validated on insertion and retained unchanged afterward so later price changes do not rewrite pending purchases or financial history.

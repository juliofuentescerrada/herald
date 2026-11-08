# M0 shell state captures

8 November 2026 · proposals for the `m0-web-shell` visual review (gate 1.2). Browser captures of [shell-states.html](../../../../prototypes/frontend/shell-states.html), drawn from the visual direction guide and the existing prototype patterns where no mockup existed. They are not production screenshots. Approved by the maintainer on 8 November 2026 as the gate 1.2 input; see the change's `design.md`.

| State | Desktop | Mobile |
| --- | --- | --- |
| Public shell and representative static page | [Desktop](shell-public-shell-desktop.png) | [Menu closed](shell-public-shell-mobile.png) · [Menu open](shell-public-shell-mobile-menu.png) |
| Shared controls: button variants and states, loading, unavailable with reason, status labels, feedback, field error | [Desktop](shell-controls-desktop.png) | [Mobile](shell-controls-mobile.png) |
| API unavailable or offline, with retry | [Desktop](shell-api-unavailable-desktop.png) | [Mobile](shell-api-unavailable-mobile.png) |
| A section failed to load (new release) | [Desktop](shell-route-failed-desktop.png) | [Mobile](shell-route-failed-mobile.png) |
| Public page not found (404) | [Desktop](shell-not-found-public-desktop.png) | [Mobile](shell-not-found-public-mobile.png) |
| Admin page not found, generic | [Desktop](shell-not-found-admin-desktop.png) | [Mobile](shell-not-found-admin-mobile.png) |
| Context replaced in another tab | [Desktop](shell-context-replaced-desktop.png) | [Mobile](shell-context-replaced-mobile.png) |

Reused from earlier captures: the admin shell wide and narrow and the missing-organisation state ([journeys](../journeys/README.md)), and the denied private link. The [manifest](manifest.json) records each source, viewport and hash. Captures check rendering, page errors and overflow only; keyboard order, screen readers and contrast are verified in the implementation's catalogue.

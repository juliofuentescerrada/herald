# Identity: sign-in and organisation access

Herald signs organisers in through the Microsoft Entra External ID directory it shares with Arcana ([ADR 0014](../adr/0014-identity-and-organisation-isolation.md)). The directory, its `signin` user flow and its e-mail one-time passcode are Arcana's, created by hand (Arcana's `docs/guides/deploy.md` and ADR 0034, in `../arcana`) and outside every OpenTofu state. Herald adds two application registrations of its own, also by hand. Nothing here goes into Arcana's or Steward's state.

The directory proves who someone is. Herald decides what they may do: the `Organiser` role lets a person use the admin application, and Herald's own memberships decide which organisations they see.

## Values and where they go

Directory and client identifiers are not secrets, but they identify the maintainer's directory, so the repository never contains them. Local runs read them from the AppHost's user secrets.

| AppHost parameter | Value | Used by |
| --- | --- | --- |
| `auth-authority` | `https://<subdomain>.ciamlogin.com/<tenant-id>`: the tenant id in the path, no trailing slash | Admin (MSAL) as is; the host as `<value>/v2.0` |
| `auth-api-audience` | the `herald-api` client id | Host (`aud` in access tokens) |
| `auth-api-scope` | `api://<herald-api client id>/access_as_user` | Admin (requests the token) |
| `auth-admin-client-id` | the `herald-admin` client id | Admin (MSAL) |

Why the tenant id is in the path: External ID publishes its issuer on the tenant-id host (`https://<tenant-id>.ciamlogin.com/<tenant-id>/v2.0`). From the bare host, discovery reports another issuer and MSAL fails with `endpoints_resolution_error`. The issuer is read from discovery and never configured.

## 1. Register the API

In the [Entra admin center](https://entra.microsoft.com), switch to the shared directory → *App registrations* → **New registration**: `herald-api`, accounts in this directory only, no redirect URI. Then:

1. *Expose an API* → set the Application ID URI to `api://<client id>` → **Add a scope** `access_as_user`, *Admins only*, enabled.
2. *App roles* → **Create app role**: display name `Organiser`, allowed member types *Users/Groups*, value `Organiser`, description "Organises tournaments in Herald", enabled.
3. *Manifest*: `"requestedAccessTokenVersion": 2` under `api`, so tokens carry the client id as `aud`.
4. *Enterprise applications* → `herald-api` → *Properties* → **Assignment required?** *Yes*.

## 2. Register the admin application

**New registration**: `herald-admin`, accounts in this directory only, redirect URI platform *Single-page application*, `http://localhost:4200/`. The trailing slash matters: the admin sends exactly `<origin>/`. Then:

Sign-out returns to the same address, so no other URI is needed.

1. *API permissions* → **Add a permission** → *My APIs* → `herald-api` → `access_as_user`; from Microsoft Graph, `openid` and `offline_access` → **Grant admin consent**. Users of an external directory cannot consent themselves: without the grant, sign-in fails.
2. *Enterprise applications* → `herald-admin` → *Properties* → **Assignment required?** *Yes*. An unassigned person is refused at sign-in (`AADSTS50105`), and Herald shows "Herald access is by invitation".
3. *External Identities* → *User flows* → `signin` → *Applications* → **Add application** → `herald-admin`. Sign-up stays off for the whole flow (Arcana's guide, step 5).

## 3. Configure a local run

```bash
dotnet user-secrets set "Parameters:auth-authority" "https://<subdomain>.ciamlogin.com/<tenant-id>" --project src/Herald.AppHost
dotnet user-secrets set "Parameters:auth-api-audience" "<herald-api client id>" --project src/Herald.AppHost
dotnet user-secrets set "Parameters:auth-api-scope" "api://<herald-api client id>/access_as_user" --project src/Herald.AppHost
dotnet user-secrets set "Parameters:auth-admin-client-id" "<herald-admin client id>" --project src/Herald.AppHost
dotnet run --project src/Herald.AppHost
```

Without them, the Aspire dashboard asks for the missing parameter. A host started without its sign-in configuration stops at start-up with the missing key's name. An admin without `runtime-config.json` (written by `start:admin` from these values) says that its sign-in configuration is missing.

## 4. Give a person access

Invite them into the directory as Arcana's guide describes, then assign them to **both** applications:

- *Enterprise applications* → `herald-admin` → *Users and groups* → **Add user/group** → the person (default access). This lets them sign in.
- *Enterprise applications* → `herald-api` → *Users and groups* → **Add user/group** → the person, role `Organiser`. This puts the role in their access tokens. Without it the API answers 403, which Herald also shows as "Herald access is by invitation".

Their first creation makes them a Herald person (keyed by directory and object id, never e-mail) and the owner of the organisation they create.

## 5. Remove access

- **From Herald entirely:** remove both assignments. New sign-ins are refused at once. A token already issued stays valid until it expires (about an hour, the directory's default), so the role check alone is not instant revocation.
- **From one organisation:** removing the membership takes effect on the next request (the membership is checked on every organisation-scoped call, never cached). H1 has no screen for it; collaborators and ownership changes arrive in H2.

## 6. Recovery and relink

A person who cannot sign in starts with the provider's own recovery: the sign-in page offers it, and Herald cannot reset passwords or passcodes. If that fails and they need a new directory identity, the platform operator relinks their Herald person:

1. **Verify ownership out of band**, through the contact given with the invitation. Accept only evidence recorded before the problem: the invitation thread, the organisations they own and when they were created. Never accept a password or a recovery code, and never accept a name or e-mail address alone.
2. **Create or identify the new identity** in the directory, assign it to both applications (section 4), and note its object id.
3. **Find the Herald person id** of the old identity in the target database (`organisations."Persons"`, by its `DirectoryId` and `ObjectId`).
4. **Relink**, against the target database:

   ```bash
   dotnet run --project src/Herald.Host -- relink-person <person id> <directory id> <new object id> \
     --reason "<how ownership was verified>" --operator "<who runs it>"
   ```

   It moves the identity key only. It refuses an identity that already belongs to another person, and records the previous and new keys, operator, reason and time in `organisations."IdentityRelinks"`, in the same transaction. It never merges persons or copies memberships.
5. **Remove the old identity's assignments** (section 5).
6. Ask the person to sign in with the new identity and confirm they see their organisations.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| "Herald access is by invitation" right after sign-in | Not assigned to `herald-admin` (`AADSTS50105`) or, if it appears on the first page, not assigned to `herald-api` with `Organiser` (403) |
| MSAL `endpoints_resolution_error` | `auth-authority` without the tenant id in the path |
| API 401 with `invalid_token`, issuer invalid | The host's authority is not `<auth-authority>/v2.0`, or the API registration still issues v1 tokens (`requestedAccessTokenVersion`) |
| Sign-in fails with a consent error | Admin consent not granted on `herald-admin` (section 2, step 1) |
| Redirect URI mismatch | The registration has `http://localhost:4200` without the trailing slash |

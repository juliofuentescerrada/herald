# Identity: sign-in and organisation access

Herald signs organisers in through the Microsoft Entra External ID directory it shares with Arcana ([ADR 0014](../adr/0014-identity-and-organisation-isolation.md)). The directory is a platform resource of Steward, the shared platform: since 21 November 2026 it lives in Steward's `rg-identity` resource group, managed by hand by Steward's operator and outside every OpenTofu state ([Steward's operations guide](https://github.com/juliofuentescerrada/steward/blob/main/docs/m3/operations.md#directorio-de-usuarios-compartido), Steward ADR 0011). Its `signin` user flow and e-mail one-time passcode were created by Arcana and serve both applications (Arcana's `docs/guides/deploy.md` and ADR 0034, in `../arcana`). Herald adds two application registrations of its own, also by hand. Nothing here goes into Arcana's or Steward's state.

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

To start with synthetic data (ADR 0019, `dev-synthetic-data`), also set your own object id in the directory (*Users* → your account → *Object ID*). The AppHost's `seed` resource then seeds the scenarios once, after the host is ready, with you as the owner of the seeded organisations; the directory id comes from `auth-authority`. Without it, `seed` finishes saying it was skipped. A kept data volume is not seeded twice; to start again, delete the volume.

```bash
dotnet user-secrets set "Parameters:seed-object-id" "<your object id>" --project src/Herald.AppHost
```

Without the sign-in values, the Aspire dashboard asks for the missing parameter. A host started without its sign-in configuration stops at start-up with the missing key's name. An admin without `runtime-config.json` (written by `start:admin` from these values) says that its sign-in configuration is missing.

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

## 7. Pilot applications

Pilot applications are the few programs that an owner lets act for their organisation (D-12, D-14). Herald records what each one may do. A general application console arrives in H5. Each provisioning is one record that the platform operator keeps with the invitation thread: the responsible owner and organisation, the application and its object id, the operations and tournaments agreed, and the date. Never commit that record: it holds real identifiers.

### Interactive applications

An application that acts *for a signed-in person* (a scorer's tool, for example) uses that person's token. It needs no role of its own and no grant in Herald: the person's `Organiser` role and memberships decide, exactly as in the admin application.

1. Register the application in the shared directory like `herald-admin` (section 2): its own redirect URI, the API permission `access_as_user` with admin consent, and **Assignment required?** *Yes*.
2. Assign the people who will use it to the application. They also need their `herald-api` assignment from section 4.
3. To remove access, remove the application's assignments, or the person's as in section 5.

### Server applications

An application that acts *on its own* (a results bot, for example) signs in with client credentials. It carries the `PilotApplication` role, and it acts only within the grant that an owner records in Herald.

1. Once, on `herald-api`, go to *App roles* → **Create app role**: display name `PilotApplication`, allowed member types *Applications*, value `PilotApplication`, description "A pilot server application acting within an owner's grant", enabled.
2. Register the application in the shared directory: **New registration**, accounts in this directory only, no redirect URI. Under *Certificates & secrets*, add a certificate (preferred) or a short-lived secret, and hand it to the responsible owner over the invitation thread, never through the repository.
3. *API permissions* → **Add a permission** → *My APIs* → `herald-api` → *Application permissions* → `PilotApplication` → **Grant admin consent**. The token then carries `roles: ["PilotApplication"]` and no `scp`. Herald refuses a token that has both.
4. Note the application's **object id** from *Enterprise applications* → the application → *Properties* → *Object ID*. Herald keys on that id together with the directory, never on the name. Give it to the owner.
5. The owner opens **Applications** in their organisation's workspace and chooses **Grant access**: a name, that object id, the tournaments (all, or selected ones) and the operation groups. Until the owner records the grant, every request from the application is answered with the generic "not available".
6. **Demonstrate the scope before the pilot starts:** with the application's token, read a tournament inside the grant (200), then one outside it (403, `operation-not-granted`), then one of another organisation (404). Note the results in the record.

To revoke access:

- **From one organisation:** the owner chooses **Revoke** on the Applications page. This takes effect from the application's next request, including requests with a token issued earlier, because the grant is checked on every request. The grant stays listed with who revoked it and when, and what the application recorded stays attributed to it. To change a grant, the owner revokes it and grants again.
- **From Herald entirely:** the platform operator removes the `PilotApplication` permission, or deletes the application's credential or registration. New tokens are then refused. A token already issued keeps its role until it expires (about an hour), but every Herald grant check still applies to it.

## 8. Deployed slots

The `main` and `preview` slots ([deployment](deployment.md)) sign in through the same directory and registrations.

1. **Redirect URIs:** in `herald-admin` → *Authentication* → *Single-page application*, add each slot's admin address with its trailing slash, `https://ca-herald-admin.<environment domain>/` and `https://ca-herald-preview-admin.<environment domain>/`. `tofu -chdir=infra output slots` prints both addresses.
2. **Personas:** two users in the shared directory, the owner (seeded as Avery Quinn) and an owner of another organisation (seeded as Rowan Ellis), who shows isolation (D-21). Create each from *Users* → *All users* → **New user** → *Create new external user*, with an e-mail sign-in identity (the form an application's *Users and groups* opens creates an internal user, which the `signin` flow does not serve), then reset its password once so it signs in with a password rather than a code. Assign each to `herald-admin` and to `herald-api` with `Organiser`, and to no other application. Keep their passwords in the password manager.
3. **GitHub values**, never in Git (*Settings → Secrets and variables → Actions*). The object ids are secrets: run logs are public, and only secrets are masked in them.

| Name | Kind | Value |
| --- | --- | --- |
| `HERALD_AUTH_AUTHORITY`, `HERALD_AUTH_API_AUDIENCE`, `HERALD_AUTH_API_SCOPE`, `HERALD_AUTH_CLIENT_ID` | Variable | As the AppHost parameters of the table above |
| `HERALD_PERSONA_MAIN_OBJECT_ID` | Secret | The owner persona's object id |
| `HERALD_PERSONA_RIVAL_OBJECT_ID` | Secret | The other owner's object id |

The next deployment of `main` applies them to both slots' seeding jobs, which seed each persona's organisation under their identity.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| "Herald access is by invitation" right after sign-in | Not assigned to `herald-admin` (`AADSTS50105`) or, if it appears on the first page, not assigned to `herald-api` with `Organiser` (403) |
| MSAL `endpoints_resolution_error` | `auth-authority` without the tenant id in the path |
| API 401 with `invalid_token`, issuer invalid | The host's authority is not `<auth-authority>/v2.0`, or the API registration still issues v1 tokens (`requestedAccessTokenVersion`) |
| Sign-in fails with a consent error | Admin consent not granted on `herald-admin` (section 2, step 1) |
| Redirect URI mismatch | The registration has `http://localhost:4200` without the trailing slash |
| A server application gets 404 `organisation-not-available` | No active grant in that organisation: the owner has not granted it, has revoked it, or entered another object id |
| A server application gets 403 `operation-not-granted` | The grant does not include that operation group, or does not cover that tournament. The detail names the group |
| A server application gets 403 on every endpoint | Its token has no `PilotApplication` role, or it carries a delegated `scp` |

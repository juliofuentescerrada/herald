# Each slot's three container apps and its seeding job (design D-3, D-4). OpenTofu creates them with a public placeholder
# image and never changes it afterwards: the deployment workflow sets Herald's images (m4-deploy).

locals {
  placeholder_image = "mcr.microsoft.com/k8se/quickstart:latest"
  # Every Herald image listens here (m4-images); the public server through PORT.
  port = 8080

  tenant_id = var.auth_authority == null ? null : reverse(split("/", var.auth_authority))[0]

  # Addresses from the names and the environment's domain, so the apps can refer to each other without a cycle.
  urls = { for slot, s in local.slots : slot => {
    api    = "https://ca-${s.prefix}-api.internal.${local.domain}"
    public = "https://ca-${s.prefix}-public.${local.domain}"
    admin  = "https://ca-${s.prefix}-admin.${local.domain}"
  } }

  # What the host needs in a slot, and the job too, since it runs the host in process (m4-cloud-runtime).
  host_env = { for slot, s in local.slots : slot => {
    # No password: the host signs in with the identity's Entra token, as the role Steward names after it.
    ConnectionStrings__herald             = "Host=${local.postgres.host};Database=${s.database};Username=id-${s.prefix}-api;Ssl Mode=Require"
    AZURE_CLIENT_ID                       = azurerm_user_assigned_identity.api[slot].client_id
    Herald__Database__Authentication      = "Entra"
    Herald__Database__Identity            = azurerm_user_assigned_identity.api[slot].client_id
    Herald__Messaging__Broker             = "None"
    Herald__Authentication__Authority     = var.auth_authority == null ? null : "${var.auth_authority}/v2.0"
    Herald__Authentication__Audience      = var.auth_api_audience
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.this[slot].connection_string
    # Decision session of 22 November 2026: traces at 25 %, logs and metrics unsampled.
    Herald__Telemetry__TraceSampleRatio = "0.25"
  } }

  apps = merge([for slot, s in local.slots : {
    "${slot}-api" = {
      name     = "ca-${s.prefix}-api"
      external = false
      identity = azurerm_user_assigned_identity.api[slot]
      probes   = true
      cpu      = 0.5
      memory   = "1Gi"
      env      = local.host_env[slot]
    }
    "${slot}-public" = {
      name     = "ca-${s.prefix}-public"
      external = true
      identity = azurerm_user_assigned_identity.web[slot]
      probes   = false
      cpu      = 0.25
      memory   = "0.5Gi"
      env = {
        PORT             = tostring(local.port)
        HERALD_API_URL   = local.urls[slot].api
        HERALD_ADMIN_URL = local.urls[slot].admin
        # Angular's SSR server answers 400 to a host not on its allowlist (m4-images design).
        NG_ALLOWED_HOSTS = trimprefix(local.urls[slot].public, "https://")
      }
    }
    "${slot}-admin" = {
      name     = "ca-${s.prefix}-admin"
      external = true
      identity = azurerm_user_assigned_identity.web[slot]
      probes   = false
      cpu      = 0.25
      memory   = "0.5Gi"
      env = {
        HERALD_API_URL        = local.urls[slot].api
        HERALD_AUTH_AUTHORITY = var.auth_authority
        HERALD_AUTH_CLIENT_ID = var.auth_admin_client_id
        HERALD_AUTH_API_SCOPE = var.auth_api_scope
        HERALD_PUBLIC_URL     = local.urls[slot].public
      }
    }
  }]...)
}

resource "azurerm_container_app" "this" {
  for_each                     = local.apps
  name                         = each.value.name
  resource_group_name          = data.azurerm_resource_group.this.name
  container_app_environment_id = data.azurerm_container_app_environment.shared.id
  workload_profile_name        = "Consumption"
  revision_mode                = "Single"
  tags                         = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [each.value.identity.id]
  }

  registry {
    server   = local.registry.login_server
    identity = each.value.identity.id
  }

  ingress {
    # The API only inside cae-shared: the web apps forward /api to it (m4-cloud-runtime D-5).
    external_enabled = each.value.external
    target_port      = local.port
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    # ADR 0019: no cost while nobody uses the slot.
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "app"
      image  = local.placeholder_image
      cpu    = each.value.cpu
      memory = each.value.memory

      dynamic "env" {
        for_each = { for name, value in each.value.env : name => value if value != null }
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "liveness_probe" {
        for_each = each.value.probes ? [1] : []
        content {
          transport = "HTTP"
          port      = local.port
          path      = "/alive"
        }
      }

      dynamic "readiness_probe" {
        for_each = each.value.probes ? [1] : []
        content {
          transport = "HTTP"
          port      = local.port
          path      = "/health"
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  depends_on = [azurerm_role_assignment.acr_pull]
}

# Run by the deployment before the apps change: on preview it resets Herald's schemas, then migrates and seeds; on main
# it migrates and seeds only what is missing (ADR 0019, m4-cloud-runtime D-6).
resource "azurerm_container_app_job" "seed" {
  for_each                     = local.slots
  name                         = "caj-${each.value.prefix}-seed"
  resource_group_name          = data.azurerm_resource_group.this.name
  location                     = data.azurerm_resource_group.this.location
  container_app_environment_id = data.azurerm_container_app_environment.shared.id
  workload_profile_name        = "Consumption"
  replica_timeout_in_seconds   = 900
  # A failed seed stops the deployment before the apps change; the next deployment runs it again.
  replica_retry_limit = 0
  tags                = local.tags

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.api[each.key].id]
  }

  registry {
    server   = local.registry.login_server
    identity = azurerm_user_assigned_identity.api[each.key].id
  }

  template {
    container {
      name   = "seed"
      image  = local.placeholder_image
      cpu    = 0.5
      memory = "1Gi"

      dynamic "env" {
        for_each = { for name, value in merge(local.host_env[each.key], {
          Herald__Seed__Reset                        = each.value.reset ? "true" : null
          Herald__Seed__Personas__Main__DirectoryId  = var.persona_main_object_id == null ? null : local.tenant_id
          Herald__Seed__Personas__Main__ObjectId     = var.persona_main_object_id
          Herald__Seed__Personas__Rival__DirectoryId = var.persona_rival_object_id == null ? null : local.tenant_id
          Herald__Seed__Personas__Rival__ObjectId    = var.persona_rival_object_id
        }) : name => value if value != null }
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  depends_on = [azurerm_role_assignment.acr_pull]
}

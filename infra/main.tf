# Herald's resources on Steward's shared platform (ADRs 0012, 0019; m4-infra). infra/bootstrap.sh creates rg-herald;
# Steward's onboarding creates id-herald-delivery, its grants and this state's container.

locals {
  # Both slots from one state (design D-1): main has no suffix, preview puts -preview before the function.
  slots = {
    main    = { prefix = "herald", database = "herald_main", reset = false }
    preview = { prefix = "herald-preview", database = "herald_preview", reset = true }
  }

  tags = {
    workload      = "herald"
    environment   = "poc"
    "managed-by"  = "opentofu"
    "created-for" = "herald on the shared platform"
  }

  # Steward's documented names (its docs/m0/consumer-contract.md); never its state.
  shared = {
    resource_group = "rg-shared"
    environment    = "cae-shared"
    log_analytics  = "log-shared"
    registry       = "crjfcshared"
    postgres       = "psql-jfc-shared"
  }
}

data "azurerm_resource_group" "this" {
  name = "rg-herald"
}

data "azurerm_resource_group" "shared" {
  name = local.shared.resource_group
}

# Read for its ID and default domain; the other shared resources are only needed by ID.
data "azurerm_container_app_environment" "shared" {
  name                = local.shared.environment
  resource_group_name = data.azurerm_resource_group.shared.name
}

locals {
  shared_providers           = "${data.azurerm_resource_group.shared.id}/providers"
  log_analytics_workspace_id = "${local.shared_providers}/Microsoft.OperationalInsights/workspaces/${local.shared.log_analytics}"
  registry = {
    id           = "${local.shared_providers}/Microsoft.ContainerRegistry/registries/${local.shared.registry}"
    login_server = "${local.shared.registry}.azurecr.io"
  }
  postgres = {
    id   = "${local.shared_providers}/Microsoft.DBforPostgreSQL/flexibleServers/${local.shared.postgres}"
    host = "${local.shared.postgres}.postgres.database.azure.com"
  }
  domain = data.azurerm_container_app_environment.shared.default_domain
}

# The slot's identity: the API's and the job's, and the only role in the slot's database (Steward ADR 0010).
resource "azurerm_user_assigned_identity" "api" {
  for_each            = local.slots
  name                = "id-${each.value.prefix}-api"
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location
  tags                = local.tags
}

# The web apps pull their images with an identity that reaches no database (design D-2, review Q1).
resource "azurerm_user_assigned_identity" "web" {
  for_each            = local.slots
  name                = "id-${each.value.prefix}-web"
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location
  tags                = local.tags
}

# Through Steward's delegation on the registry, whose condition allows AcrPull to service principals only. Keyed by
# name, not by principal id, so the keys are known at plan time.
resource "azurerm_role_assignment" "acr_pull" {
  for_each = merge(
    { for slot, identity in azurerm_user_assigned_identity.api : "${slot}-api" => identity.principal_id },
    { for slot, identity in azurerm_user_assigned_identity.web : "${slot}-web" => identity.principal_id },
  )
  scope                = local.registry.id
  role_definition_name = "AcrPull"
  principal_id         = each.value
  principal_type       = "ServicePrincipal"
}

# Traces count against log-shared's daily cap, shared with Arcana and Archivist: the host samples them (m4-cloud-runtime).
resource "azurerm_application_insights" "this" {
  for_each            = local.slots
  name                = "appi-${each.value.prefix}"
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location
  workspace_id        = local.log_analytics_workspace_id
  application_type    = "web"
  tags                = local.tags
}

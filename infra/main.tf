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
